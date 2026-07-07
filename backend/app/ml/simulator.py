import time
import random
import requests
from datasets import load_dataset

API_URL = "http://localhost:8000/api/v1/tickets/"

print("Loading Bitext dataset for simulation...")
ds = load_dataset("bitext/bitext-customer-support-llm-chatbot-training-dataset")
df = ds['train'].to_pandas()

# Use instruction column
utterances = df['instruction'].tolist()

subjects_by_category = {
    "billing": [
        "Question about my invoice",
        "Unexpected charge on my account",
        "Need billing statement",
        "Wrong amount charged",
        "Payment not going through",
    ],
    "refund": [
        "Request for refund",
        "Want to return my order",
        "Refund not received yet",
        "Cancellation and refund request",
        "Money not returned to account",
    ],
    "account_access": [
        "Cannot login to my account",
        "Password reset not working",
        "Account locked out",
        "Username forgotten",
        "Two factor authentication issue",
    ],
    "technical": [
        "App not working properly",
        "Website keeps crashing",
        "Feature not loading",
        "Error message on screen",
        "Integration broken",
    ],
    "delivery": [
        "Where is my order",
        "Package not delivered",
        "Wrong item received",
        "Delivery address change",
        "Order tracking not updating",
    ],
    "general": [
        "General question",
        "Need assistance",
        "How does this work",
        "Looking for information",
        "Quick question",
    ]
}

tiers = ["standard", "standard", "standard", "premium", "enterprise"]

def get_random_ticket():
    utterance = random.choice(utterances)
    category_key = random.choice(list(subjects_by_category.keys()))
    subject = random.choice(subjects_by_category[category_key])
    tier = random.choice(tiers)
    return {
        "subject": subject,
        "description": utterance,
        "customer_tier": tier
    }

print("Starting ticket simulator...")
print("Injecting one ticket every 30 seconds. Press Ctrl+C to stop.\n")

count = 0
while True:
    try:
        ticket = get_random_ticket()
        response = requests.post(API_URL, json=ticket)

        if response.status_code == 200:
            data = response.json()
            t = data['ticket']
            p = data['prediction']
            count += 1
            print(f"[{count}] New ticket: '{t['subject']}'")
            print(f"     Category: {p['predicted_category']} ({round(p['category_confidence']*100)}%)")
            print(f"     Urgency:  {p['predicted_urgency']} ({round(p['urgency_confidence']*100)}%)")
            print(f"     Routing:  {p['routing_mode']} → {p['recommended_team']}")
            print()
        else:
            print(f"Error: {response.status_code} — {response.text}")

        time.sleep(30)

    except KeyboardInterrupt:
        print(f"\nSimulator stopped. Injected {count} tickets.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)
