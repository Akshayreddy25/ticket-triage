from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Ticket, Feedback, User
from app.core.deps import get_agent_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    total = db.query(Ticket).count()
    new = db.query(Ticket).filter(Ticket.status == "new").count()
    assigned = db.query(Ticket).filter(Ticket.status == "assigned").count()
    in_progress = db.query(Ticket).filter(Ticket.status == "in_progress").count()
    resolved = db.query(Ticket).filter(Ticket.status == "resolved").count()
    high_urgency = db.query(Ticket).filter(Ticket.urgency == "high").count()

    by_category = {}
    for cat in ["billing", "refund", "technical", "account_access", "delivery", "general"]:
        by_category[cat] = db.query(Ticket).filter(Ticket.category == cat).count()

    feedback_total = db.query(Feedback).count()
    feedback_correct = db.query(Feedback).filter(Feedback.routing_correct == True).count()
    routing_accuracy = round(feedback_correct / feedback_total * 100, 1) if feedback_total > 0 else 0

    return {
        "total_tickets": total,
        "by_status": {
            "new": new,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved
        },
        "high_urgency": high_urgency,
        "by_category": by_category,
        "routing_accuracy": routing_accuracy,
        "total_feedback": feedback_total
    }
