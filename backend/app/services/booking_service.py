from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.slot import Slot
from app.models.appointment import Appointment

def create_booking(db: Session, user_id, data):
    slot = db.execute(
        select(Slot)
        .where(Slot.id == data.slot_id)
        .with_for_update()
    ).scalar_one_or_none()

    if not slot:
        raise Exception("Slot not found")

    if slot.status != "OPEN":
        raise Exception("Slot not available")

    if slot.booked_capacity + data.people_count > slot.max_capacity:
        raise Exception("Slot is full")

    slot.booked_capacity += data.people_count

    if slot.booked_capacity == slot.max_capacity:
        slot.status = "FULL"

    appointment = Appointment(
        user_id=user_id,
        appointment_type_id=slot.appointment_type_id,
        slot_id=slot.id,
        people_count=data.people_count,
        created_at=datetime.utcnow()
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment
