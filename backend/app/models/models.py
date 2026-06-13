import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Boolean,
    DateTime, ForeignKey, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class UserRole(str, enum.Enum):
    customer = "customer"
    agent = "agent"
    team_lead = "team_lead"
    admin = "admin"

class TicketStatus(str, enum.Enum):
    new = "new"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"

class RoutingMode(str, enum.Enum):
    automatic = "automatic"
    suggested = "suggested"
    manual = "manual"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer)
    team = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="customer",
                          foreign_keys="Ticket.customer_id")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.new)
    customer_tier = Column(String, default="standard")
    category = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    assigned_team = Column(String, nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_agent_id = Column(UUID(as_uuid=True),
                               ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                       onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="tickets",
                           foreign_keys=[customer_id])

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    predicted_category = Column(String, nullable=False)
    category_confidence = Column(Float, nullable=False)
    predicted_urgency = Column(String, nullable=False)
    urgency_confidence = Column(Float, nullable=False)
    recommended_team = Column(String, nullable=False)
    routing_mode = Column(Enum(RoutingMode))
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    predicted_category = Column(String)
    actual_category = Column(String)
    predicted_urgency = Column(String)
    actual_urgency = Column(String)
    routing_correct = Column(Boolean)
    feedback_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    predicted_category = Column(String)
    actual_category = Column(String)
    predicted_urgency = Column(String)
    actual_urgency = Column(String)
    category_confidence = Column(Float)
    urgency_confidence = Column(Float)
    routing_mode = Column(String)
    routing_correct = Column(Boolean, nullable=True)
    faithfulness_score = Column(Float, nullable=True)
    draft_outcome = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
