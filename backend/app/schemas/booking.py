from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class BookingCreate(BaseModel):
    slot_id: UUID
    people_count: int = 1

class BookingResponse(BaseModel):
    id: UUID
    appointment_type_id: UUID
    slot_id: UUID
    user_id: UUID
    people_count: int
    status: str
    created_at: datetime
    appointment_type_name: str = ""
    slot_date: str = ""
    start_time: str = ""
    end_time: str = ""
    booked_by: str = ""

    class Config:
        from_attributes = True
