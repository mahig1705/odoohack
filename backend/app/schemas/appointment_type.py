from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AppointmentTypeCreate(BaseModel):
    name: str
    description: Optional[str]
    duration_minutes: int
    appointment_mode: str
    location: Optional[str]

class AppointmentTypeResponse(BaseModel):
    id: UUID
    name: str
    duration_minutes: int
    appointment_mode: str
    is_published: bool

    class Config:
        from_attributes = True
