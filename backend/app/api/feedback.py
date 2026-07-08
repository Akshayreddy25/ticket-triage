from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import FeedbackCreate, FeedbackResponse
from app.models.models import Feedback, Ticket, User
from app.core.deps import get_agent_user

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/", response_model=FeedbackResponse)
def submit_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == feedback_data.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    feedback = Feedback(
        ticket_id=feedback_data.ticket_id,
        agent_id=current_user.id,
        predicted_category=ticket.category,
        actual_category=feedback_data.actual_category,
        predicted_urgency=ticket.urgency,
        actual_urgency=feedback_data.actual_urgency,
        routing_correct=feedback_data.routing_correct,
        feedback_notes=feedback_data.feedback_notes
    )
    ticket.category = feedback_data.actual_category
    ticket.urgency = feedback_data.actual_urgency
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/stats")
def get_feedback_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    total = db.query(Feedback).count()
    correct = db.query(Feedback).filter(Feedback.routing_correct == True).count()
    accuracy = round(correct / total * 100, 1) if total > 0 else 0
    return {
        "total_feedback": total,
        "correct_routing": correct,
        "routing_accuracy": accuracy
    }
