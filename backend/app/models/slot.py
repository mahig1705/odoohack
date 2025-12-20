from sqlalchemy import Column, Date, Time, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class Slot(Base):
    __tablename__ = "slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_type_id = Column(UUID(as_uuid=True), ForeignKey("appointment_types.id"))
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    max_capacity = Column(Integer, default=1)
    booked_capacity = Column(Integer, default=0)
    status = Column(String(20), default="OPEN")  
