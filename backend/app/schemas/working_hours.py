from pydantic import BaseModel
from uuid import UUID
from datetime import time

class WorkingHoursCreate(BaseModel):
    appointment_type_id: UUID
    weekday: int
    start_time: time
    end_time: time
