"""Small CLI to generate slots for an appointment type and date.
Run: python generate_slots_cli.py <appointment_type_id> <YYYY-MM-DD>

This imports the existing `generate_slots` service to create slots in the DB.
"""
import sys
from datetime import datetime
from app.database import SessionLocal
from app.services.slot_service import generate_slots


def main():
    if len(sys.argv) != 3:
        print("Usage: python generate_slots_cli.py <appointment_type_id> <YYYY-MM-DD>")
        sys.exit(2)

    appointment_type_id = sys.argv[1]
    try:
        slot_date = datetime.strptime(sys.argv[2], "%Y-%m-%d").date()
    except ValueError:
        print("Date must be YYYY-MM-DD")
        sys.exit(2)

    db = SessionLocal()
    try:
        generate_slots(db, appointment_type_id, slot_date)
        print(f"Slots generated for {appointment_type_id} on {slot_date}")
    except Exception as e:
        print("Error:", e)
        sys.exit(1)
    finally:
        db.close()


if __name__ == '__main__':
    main()
