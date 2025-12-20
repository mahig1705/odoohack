from pydantic import BaseModel
from uuid import UUID

class BookingCreate(BaseModel):
    slot_id: UUID
    people_count: int = 1
