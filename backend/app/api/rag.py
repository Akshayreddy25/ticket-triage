from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Ticket
from app.models.rag_models import DraftResponse
from app.services.rag_service import (
    find_similar_tickets, generate_draft_response,
    save_draft, embed_resolved_tickets
)
from app.core.deps import get_agent_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/rag", tags=["rag"])

class DraftOutcome(BaseModel):
    outcome: str
    feedback_notes: Optional[str] = None

@router.get("/similar/{ticket_id}")
def get_similar_tickets(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    text = f"{ticket.subject} {ticket.description}"
    similar = find_similar_tickets(db, text, limit=5)

    return {
        "ticket_id": str(ticket_id),
        "similar_tickets": similar,
        "count": len(similar)
    }

@router.post("/draft/{ticket_id}")
def generate_draft(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    text = f"{ticket.subject} {ticket.description}"
    similar = find_similar_tickets(db, text, limit=5)

    if not similar:
        return {
            "draft": "No similar resolved tickets found. Please handle this ticket manually.",
            "similar_tickets": [],
            "citations": []
        }

    draft = generate_draft_response(
        ticket.subject,
        ticket.description,
        similar,
        ticket.category
    )

    save_draft(db, ticket_id, draft, [t["ticket_id"] for t in similar])

    return {
        "draft": draft,
        "similar_tickets": similar[:3],
        "citations": [t["ticket_id"] for t in similar[:3]]
    }

@router.post("/draft/{ticket_id}/outcome")
def submit_draft_outcome(
    ticket_id: uuid.UUID,
    outcome_data: DraftOutcome,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    draft = db.query(DraftResponse).filter(
        DraftResponse.ticket_id == ticket_id
    ).first()

    if not draft:
        raise HTTPException(status_code=404, detail="No draft found for this ticket")

    draft.outcome = outcome_data.outcome
    db.commit()

    return {"message": "Outcome recorded", "outcome": outcome_data.outcome}

@router.post("/embed")
def trigger_embedding(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    def run_embedding(db):
        count = embed_resolved_tickets(db)
        print(f"Embedded {count} tickets")

    background_tasks.add_task(run_embedding, db)
    return {"message": "Embedding job started in background"}

@router.get("/stats")
def get_rag_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_agent_user)
):
    from app.models.rag_models import TicketEmbedding
    total_embedded = db.query(TicketEmbedding).count()
    total_drafts = db.query(DraftResponse).count()
    accepted = db.query(DraftResponse).filter(
        DraftResponse.outcome == "accepted"
    ).count()
    rejected = db.query(DraftResponse).filter(
        DraftResponse.outcome == "rejected"
    ).count()
    acceptance_rate = round(accepted / total_drafts * 100, 1) if total_drafts > 0 else 0

    return {
        "total_embedded": total_embedded,
        "total_drafts": total_drafts,
        "accepted": accepted,
        "rejected": rejected,
        "acceptance_rate": acceptance_rate
    }
