from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ticket_service import create_ticket
from app.schemas.schemas import TicketCreate
import random

router = APIRouter(prefix="/simulate", tags=["simulate"])

SAMPLE_TICKETS = [
    ("Cannot login to my account", "I have been trying to login since yesterday but keep getting an error message saying invalid credentials. I already reset my password twice."),
    ("Unexpected charge on my bill", "I noticed a charge of $49.99 on my account that I did not authorize. Please refund this immediately."),
    ("Order not delivered", "My order was supposed to arrive 3 days ago but I still have not received it. The tracking shows it has been stuck at the warehouse."),
    ("App keeps crashing", "Every time I try to open the mobile app it crashes immediately. I have tried reinstalling but the issue persists."),
    ("Need refund for cancelled order", "I cancelled my order 5 days ago but have not received my refund yet. Please process this urgently."),
    ("Account hacked", "Someone unauthorized accessed my account and changed my email and password. I cannot get back in. This is urgent."),
    ("Wrong item received", "I ordered a blue shirt size medium but received a red shirt size large. Please send the correct item."),
    ("Payment not processing", "I have tried to make a payment 3 times but it keeps failing. I have checked my card details and they are correct."),
    ("Technical error on website", "Getting a 500 error every time I try to access my order history. This has been happening for 2 days."),
    ("Subscription cancellation", "I would like to cancel my subscription effective immediately and request a refund for the unused portion."),
]

@router.post("/burst")
def simulate_burst(count: int = 10, db: Session = Depends(get_db)):
    results = []
    for _ in range(count):
        subject, description = random.choice(SAMPLE_TICKETS)
        tier = random.choice(["standard", "standard", "premium", "enterprise"])
        ticket_data = TicketCreate(
            subject=subject,
            description=description,
            customer_tier=tier
        )
        ticket, prediction = create_ticket(db, ticket_data)
        results.append({
            "ticket_id": str(ticket.id),
            "category": prediction["predicted_category"],
            "urgency": prediction["predicted_urgency"],
            "confidence": prediction["category_confidence"]
        })
    return {"injected": len(results), "tickets": results}
