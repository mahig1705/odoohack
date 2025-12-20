from pydantic import BaseModel
from uuid import UUID
from datetime import date, time

class SlotGenerateRequest(BaseModel):
    appointment_type_id: UUID
    slot_date: date

class SlotResponse(BaseModel):
    id: UUID
    appointment_type_id: UUID
    slot_date: date
    start_time: time
    end_time: time
    max_capacity: int
    booked_capacity: int
    status: str

    class Config:
        from_attributes = True
