from pydantic import BaseModel
from uuid import UUID

class AppointmentQuestionCreate(BaseModel):
    appointment_type_id: UUID
    question_text: str
    input_type: str = "text"
    is_required: bool = False
