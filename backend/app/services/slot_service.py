from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.slot import Slot
from app.models.working_hours import WorkingHours
from app.models.appointment_type import AppointmentType

def generate_slots(db: Session, appointment_type_id, slot_date):
    appointment = db.query(AppointmentType).filter(
        AppointmentType.id == appointment_type_id
    ).first()

    if not appointment:
        raise Exception("Appointment type not found")

    weekday = slot_date.weekday()

    working_hours = db.query(WorkingHours).filter(
        WorkingHours.appointment_type_id == appointment_type_id,
        WorkingHours.weekday == weekday
    ).all()

    if not working_hours:
        raise Exception("No working hours defined for this day")

    for wh in working_hours:
        start = datetime.combine(slot_date, wh.start_time)
        end = datetime.combine(slot_date, wh.end_time)

        while start + timedelta(minutes=appointment.duration_minutes) <= end:
            slot = Slot(
                appointment_type_id=appointment_type_id,
                slot_date=slot_date,
                start_time=start.time(),
                end_time=(start + timedelta(minutes=appointment.duration_minutes)).time()
            )
            db.add(slot)
            start += timedelta(minutes=appointment.duration_minutes)

    db.commit()
