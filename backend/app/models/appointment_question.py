from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class AppointmentQuestion(Base):
    __tablename__ = "appointment_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_type_id = Column(UUID(as_uuid=True), ForeignKey("appointment_types.id"), nullable=False)
    question_text = Column(String, nullable=False)
    input_type = Column(String, default="text")  # text / number / textarea
    is_required = Column(Boolean, default=False)
