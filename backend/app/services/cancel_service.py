from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.slot import Slot
from app.services.appointment_status_service import log_status_change


def cancel_appointment(db: Session, appointment_id, user_id):
    appointment = db.execute(
        select(Appointment)
        .where(
            Appointment.id == appointment_id,
            Appointment.user_id == user_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if not appointment:
        raise Exception("Appointment not found")

    if appointment.status == "CANCELLED":
        raise Exception("Appointment already cancelled")

    slot = db.execute(
        select(Slot)
        .where(Slot.id == appointment.slot_id)
        .with_for_update()
    ).scalar_one()

    slot.booked_capacity -= appointment.people_count

    if slot.booked_capacity < slot.max_capacity:
        slot.status = "OPEN"

    old_status = appointment.status      
    appointment.status = "CANCELLED"

    db.commit()
    log_status_change(
        db=db,
        appointment_id=appointment.id,
        old_status=old_status,
        new_status="CANCELLED",
        user_id=user_id
    )
