from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class AppointmentAnswer(Base):
    __tablename__ = "appointment_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("appointment_questions.id"), nullable=False)
    answer = Column(Text, nullable=False)
