from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AppointmentTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    appointment_mode: str
    location: Optional[str] = None

class AppointmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    appointment_mode: Optional[str] = None
    location: Optional[str] = None

class AppointmentTypeResponse(BaseModel):
    id: UUID
    name: str
    duration_minutes: int
    appointment_mode: str
    is_published: bool

    class Config:
        from_attributes = True
