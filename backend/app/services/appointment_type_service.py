from sqlalchemy.orm import Session
from app.models.appointment_type import AppointmentType
from app.schemas.appointment_type import AppointmentTypeUpdate
from uuid import UUID

def create_appointment_type(db: Session, data, user_id):
    appointment = AppointmentType(
        name=data.name,
        description=data.description,
        duration_minutes=data.duration_minutes,
        appointment_mode=data.appointment_mode,
        location=data.location,
        created_by=user_id
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment_type(db: Session, appointment_id: UUID, data: AppointmentTypeUpdate, user_id: UUID):
    """Update an appointment type with partial data. Uses exclude_unset=True to only update provided fields."""
    appointment = db.query(AppointmentType).filter(
        AppointmentType.id == appointment_id,
        AppointmentType.created_by == user_id
    ).first()

    if not appointment:
        return None

    # Convert Pydantic model to dict, excluding unset fields
    update_data = data.model_dump(exclude_unset=True)
    
    # Update only the fields that were provided
    for field, value in update_data.items():
        # Skip None values for optional fields (they mean "don't change")
        if value is not None:
            setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return appointment


def publish_appointment_type(db: Session, appointment_id, user_id):
    appointment = db.query(AppointmentType).filter(
        AppointmentType.id == appointment_id,
        AppointmentType.created_by == user_id
    ).first()

    if not appointment:
        return None

    # Toggle publish status
    appointment.is_published = not appointment.is_published
    db.commit()
    db.refresh(appointment)
    return appointment
