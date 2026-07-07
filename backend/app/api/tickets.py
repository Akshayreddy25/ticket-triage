from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import TicketCreate, TicketResponse, TicketListResponse, TicketWithPrediction
from app.services.ticket_service import create_ticket, get_ticket, get_tickets
import uuid

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=TicketWithPrediction)
def submit_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    ticket_obj, prediction = create_ticket(db, ticket)
    return {"ticket": ticket_obj, "prediction": prediction}

@router.get("/", response_model=TicketListResponse)
def list_tickets(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    tickets, total = get_tickets(db, skip, limit)
    return {"tickets": tickets, "total": total}

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_single_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db)):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
