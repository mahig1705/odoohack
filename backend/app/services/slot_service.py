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

    # Check if slots already exist for this date
    existing_slots = db.query(Slot).filter(
        Slot.appointment_type_id == appointment_type_id,
        Slot.slot_date == slot_date
    ).count()

    if existing_slots > 0:
        # Slots already exist, return without creating duplicates
        return

    weekday = slot_date.weekday()
    
    # Get all working hours for this appointment to provide better error messages
    all_working_hours = db.query(WorkingHours).filter(
        WorkingHours.appointment_type_id == appointment_type_id
    ).all()
    
    # Find working hours for the specific weekday
    working_hours = [wh for wh in all_working_hours if wh.weekday == weekday]

    if not working_hours:
        # Provide helpful error message with available weekdays
        weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        selected_weekday_name = weekday_names[weekday]
        available_weekdays = sorted(set(wh.weekday for wh in all_working_hours))
        available_names = [weekday_names[d] for d in available_weekdays] if available_weekdays else []
        
        if not all_working_hours:
            raise Exception(f"No working hours defined for this appointment type. Please set up working hours first.")
        else:
            available_str = ", ".join(available_names) if available_names else "none"
            raise Exception(
                f"No working hours defined for {selected_weekday_name} (weekday {weekday}). "
                f"Available days: {available_str}. Please add working hours for {selected_weekday_name}."
            )

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
