from sqlalchemy import Column, Time, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class WorkingHours(Base):
    __tablename__ = "working_hours"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_type_id = Column(UUID(as_uuid=True), ForeignKey("appointment_types.id"))
    weekday = Column(SmallInteger, nullable=False)  # 0 = Monday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
