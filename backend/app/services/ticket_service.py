from sqlalchemy.orm import Session
from app.models.models import Ticket, TicketStatus, Prediction, RoutingMode
from app.schemas.schemas import TicketCreate
from app.ml.classifier import classifier
import uuid

def create_ticket(db, ticket_data, customer_id=None):
    ticket = Ticket(
        subject=ticket_data.subject,
        description=ticket_data.description,
        customer_tier=ticket_data.customer_tier,
        status=TicketStatus.new,
        customer_id=customer_id
    )
    db.add(ticket)
    db.flush()
    text = f"{ticket_data.subject} {ticket_data.description}"
    prediction = classifier.predict(text)
    pred_record = Prediction(
        ticket_id=ticket.id,
        predicted_category=prediction["predicted_category"],
        category_confidence=prediction["category_confidence"],
        predicted_urgency=prediction["predicted_urgency"],
        urgency_confidence=prediction["urgency_confidence"],
        recommended_team=prediction["recommended_team"],
        routing_mode=RoutingMode(prediction["routing_mode"])
    )
    db.add(pred_record)
    ticket.category = prediction["predicted_category"]
    ticket.urgency = prediction["predicted_urgency"]
    ticket.assigned_team = prediction["recommended_team"]
    if prediction["routing_mode"] == "automatic":
        ticket.status = TicketStatus.assigned
    db.commit()
    db.refresh(ticket)
    return ticket, prediction

def get_ticket(db, ticket_id):
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()

def get_tickets(db, skip=0, limit=50):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(Ticket).count()
    return tickets, total
