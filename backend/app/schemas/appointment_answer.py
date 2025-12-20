from pydantic import BaseModel
from uuid import UUID

class AppointmentAnswerCreate(BaseModel):
    appointment_id: UUID
    question_id: UUID
    answer: str
