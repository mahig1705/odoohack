from sqlalchemy.orm import Session
from app.models.appointment_type import AppointmentType

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


def publish_appointment_type(db: Session, appointment_id, user_id):
    appointment = db.query(AppointmentType).filter(
        AppointmentType.id == appointment_id,
        AppointmentType.created_by == user_id
    ).first()

    if not appointment:
        return None

    appointment.is_published = True
    db.commit()
    return appointment
