from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base

class AppointmentStatusHistory(Base):
    __tablename__ = "appointment_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    old_status = Column(String, nullable=False)
    new_status = Column(String, nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    changed_at = Column(TIMESTAMP, default=datetime.utcnow)
