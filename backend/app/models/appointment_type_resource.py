from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class AppointmentTypeResource(Base):
    __tablename__ = "appointment_type_resources"

    appointment_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointment_types.id"),
        primary_key=True
    )

    resource_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resources.id"),
        primary_key=True
    )
