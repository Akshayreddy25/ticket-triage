import pandas as pd
import psycopg2
import uuid
from datetime import datetime, timedelta
import random

# Connect to database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="ticketdb",
    user="postgres",
    password="postgres"
)
cursor = conn.cursor()

print("Loading dataset...")
df = pd.read_csv("backend/app/ml/data/customer_support_tickets.csv")
print(f"Loaded {len(df)} tickets")

# Map dataset values to our schema
category_map = {
    "Technical issue": "technical",
    "Billing inquiry": "billing",
    "Refund request": "refund",
    "Product inquiry": "general",
    "Cancellation request": "refund"
}

urgency_map = {
    "Critical": "high",
    "High": "high",
    "Medium": "medium",
    "Low": "low"
}

status_map = {
    "Open": "new",
    "Pending Customer Response": "in_progress",
    "Closed": "resolved"
}

team_map = {
    "technical": "technical-support",
    "billing": "payments-support",
    "refund": "payments-support",
    "general": "general-support"
}

# Clean description — remove template placeholders
def clean_description(text):
    if pd.isna(text):
        return "No description provided"
    text = str(text)
    text = text.replace("{product_purchase}", "my product")
    text = text.replace("{product_purchased}", "my product")
    text = text.replace("{order_number}", f"#{random.randint(10000, 99999)}")
    text = text.replace("{ticket_id}", f"#{random.randint(1000, 9999)}")
    return text.strip()

# Generate realistic past timestamps
def random_timestamp():
    days_ago = random.randint(0, 60)
    hours_ago = random.randint(0, 23)
    return datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

print("Seeding tickets into database...")
inserted = 0
skipped = 0

for _, row in df.iterrows():
    try:
        ticket_id = str(uuid.uuid4())
        subject = str(row['Ticket Subject']) if not pd.isna(row['Ticket Subject']) else "Support Request"
        description = clean_description(row['Ticket Description'])
        category = category_map.get(str(row['Ticket Type']), "general")
        urgency = urgency_map.get(str(row['Ticket Priority']), "medium")
        status = status_map.get(str(row['Ticket Status']), "new")
        team = team_map.get(category, "general-support")
        created_at = random_timestamp()

        # Resolution text if ticket is closed
        resolution = None
        if status == "resolved" and not pd.isna(row.get('Resolution', None)):
            resolution = str(row['Resolution'])

        cursor.execute("""
            INSERT INTO tickets (
                id, subject, description, status,
                customer_tier, category, urgency,
                assigned_team, resolution, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            ticket_id,
            subject[:255],
            description,
            status,
            random.choice(["standard", "standard", "premium", "enterprise"]),
            category,
            urgency,
            team,
            resolution,
            created_at,
            created_at
        ))
        inserted += 1

    except Exception as e:
        skipped += 1
        continue

conn.commit()
cursor.close()
conn.close()

print(f"\nDone!")
print(f"Inserted: {inserted} tickets")
print(f"Skipped:  {skipped} tickets")
print(f"\nOpen http://localhost:3000 to see all tickets")
