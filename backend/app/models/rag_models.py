import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.session import Base

class TicketEmbedding(Base):
    __tablename__ = "ticket_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), unique=True)
    embedding = Column(Vector(384))
    content = Column(Text)
    category = Column(String, nullable=True)
    resolution = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DraftResponse(Base):
    __tablename__ = "draft_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), unique=True)
    draft_text = Column(Text)
    similar_ticket_ids = Column(Text)
    outcome = Column(String, nullable=True)
    edit_distance = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
