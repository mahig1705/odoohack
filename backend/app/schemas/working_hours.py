from pydantic import BaseModel, validator
from uuid import UUID
from datetime import time

class WorkingHoursCreate(BaseModel):
    appointment_type_id: UUID
    weekday: int
    start_time: time
    end_time: time

    @validator("weekday")
    def weekday_must_be_0_to_6(cls, v):
        if not isinstance(v, int) or v < 0 or v > 6:
            raise ValueError("weekday must be an integer in range 0 (Monday) to 6 (Sunday)")
        return v

class WorkingHoursResponse(BaseModel):
    id: UUID
    appointment_type_id: UUID
    weekday: int
    start_time: time
    end_time: time

    class Config:
        from_attributes = True