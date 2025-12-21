from pydantic import BaseModel
from uuid import UUID
from datetime import date, time


class AutoBookingRequest(BaseModel):
    latitude: float
    longitude: float
    appointment_type_id: UUID


class AutoBookingResponse(BaseModel):
    appointment_id: UUID
    resource_name: str
    start_time: str
    end_time: str
    message: str

    class Config:
        from_attributes = True

