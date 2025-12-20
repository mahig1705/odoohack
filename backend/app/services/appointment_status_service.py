from sqlalchemy.orm import Session
from app.models.appointment_status_history import AppointmentStatusHistory

def log_status_change(db: Session, appointment_id, old_status, new_status, user_id):
    log = AppointmentStatusHistory(
        appointment_id=appointment_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=user_id
    )
    db.add(log)
    db.commit()
