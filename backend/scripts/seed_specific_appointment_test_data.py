import os
import sys
from datetime import date, timedelta
from uuid import uuid4

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.database import SessionLocal
from app.models.appointment_type import AppointmentType
from app.models.working_hours import WorkingHours
from app.models.slot import Slot
from app.services.slot_service import generate_slots

APPOINTMENT_TYPE_ID = "6763a7c1-d3a7-419d-9252-2d8673f8e5bc"


def main():
    db = SessionLocal()
    try:
        apt = db.query(AppointmentType).filter(AppointmentType.id == APPOINTMENT_TYPE_ID).first()
        if not apt:
            print(f"Appointment type {APPOINTMENT_TYPE_ID} not found")
            return

        for weekday in range(7):
            existing = db.query(WorkingHours).filter(
                WorkingHours.appointment_type_id == apt.id,
                WorkingHours.weekday == weekday,
            ).first()
            if existing:
                continue
            db.add(WorkingHours(
                id=uuid4(),
                appointment_type_id=apt.id,
                weekday=weekday,
                start_time="09:00:00",
                end_time="17:00:00",
            ))
        db.commit()

        for offset in range(1, 6):
            target_date = date.today() + timedelta(days=offset)
            try:
                generate_slots(db, apt.id, target_date)
                print(f"Generated slots for {target_date}")
            except Exception as exc:
                print(f"Skipped {target_date}: {exc}")

        print("Future slots count:", db.query(Slot).filter(
            Slot.appointment_type_id == apt.id,
            Slot.slot_date >= date.today(),
        ).count())

        sample = db.query(Slot).filter(
            Slot.appointment_type_id == apt.id,
            Slot.slot_date >= date.today(),
        ).order_by(Slot.slot_date.asc(), Slot.start_time.asc()).limit(5).all()
        for s in sample:
            print(s.slot_date, s.start_time, s.end_time)
    finally:
        db.close()


if __name__ == "__main__":
    main()
