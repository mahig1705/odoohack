from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.slot import Slot

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

    appointment.status = "CANCELLED"

    db.commit()
