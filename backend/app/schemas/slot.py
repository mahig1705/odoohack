from pydantic import BaseModel
from uuid import UUID
from datetime import date

class SlotGenerateRequest(BaseModel):
    appointment_type_id: UUID
    slot_date: date
