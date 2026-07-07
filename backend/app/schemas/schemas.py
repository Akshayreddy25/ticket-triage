from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class TicketCreate(BaseModel):
    subject: str
    description: str
    customer_tier: Optional[str] = "standard"

class TicketResponse(BaseModel):
    id: UUID
    subject: str
    description: str
    status: str
    customer_tier: str
    category: Optional[str] = None
    urgency: Optional[str] = None
    assigned_team: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketListResponse(BaseModel):
    tickets: list[TicketResponse]
    total: int

class PredictionResponse(BaseModel):
    predicted_category: str
    category_confidence: float
    predicted_urgency: str
    urgency_confidence: float
    recommended_team: str
    routing_mode: str

class TicketWithPrediction(BaseModel):
    ticket: TicketResponse
    prediction: PredictionResponse

    class Config:
        from_attributes = True
