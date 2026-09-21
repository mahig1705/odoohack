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
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.services.slot_service import generate_slots


def ensure_user(db):
    email = "organizer@mycompany.com"
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(
        full_name="Local Organizer",
        email=email,
        password_hash="demo-hash",
        is_verified=True,
        requested_role="ORGANISER",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    role = db.query(Role).filter(Role.name == "ORGANISER").first()
    if role:
        existing = db.query(UserRole).filter(UserRole.user_id == user.id).first()
        if not existing:
            db.add(UserRole(user_id=user.id, role_id=role.id))
            db.commit()
    return user


def ensure_appointment_type(db, user_id):
    apt = db.query(AppointmentType).filter(AppointmentType.name.ilike("%Doctor%")) .first()
    if apt:
        return apt

    apt = AppointmentType(
        id=uuid4(),
        name="Doctor Consultation",
        description="AI-led consultation flow test",
        duration_minutes=30,
        appointment_mode="RESOURCE",
        location="Mumbai",
        created_by=user_id,
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)
    return apt


def ensure_working_hours(db, appointment_type_id):
    weekdays = [0, 1, 2]
    for weekday in weekdays:
        existing = db.query(WorkingHours).filter(
            WorkingHours.appointment_type_id == appointment_type_id,
            WorkingHours.weekday == weekday,
        ).first()
        if existing:
            continue

        db.add(WorkingHours(
            id=uuid4(),
            appointment_type_id=appointment_type_id,
            weekday=weekday,
            start_time="09:00:00",
            end_time="17:00:00",
        ))
    db.commit()


def generate_dates(days_ahead=10):
    start = date.today()
    return [start + timedelta(days=i) for i in range(days_ahead)]


def main():
    db = SessionLocal()
    try:
        user = ensure_user(db)
        apt = ensure_appointment_type(db, user.id)
        ensure_working_hours(db, apt.id)

        generated = 0
        for target_date in generate_dates(days_ahead=10):
            try:
                generate_slots(db, apt.id, target_date)
                generated += 1
                print(f"Generated slots for {target_date}")
            except Exception as exc:
                print(f"Skipped {target_date}: {exc}")

        print(f"Seeded appointment type: {apt.id} | {apt.name}")
        print(f"User: {user.id} | {user.email}")
        print(f"Total dates processed: {generated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
