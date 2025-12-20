from sqlalchemy.orm import Session
from app.models.working_hours import WorkingHours

def create_working_hours(db: Session, data):
    wh = WorkingHours(**data.dict())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

def get_working_hours_for_appointment(db: Session, appointment_type_id):
    return db.query(WorkingHours).filter(
        WorkingHours.appointment_type_id == appointment_type_id
    ).all()

def delete_working_hours(db: Session, working_hours_id):
    wh = db.query(WorkingHours).filter(WorkingHours.id == working_hours_id).first()
    if not wh:
        return None
    db.delete(wh)
    db.commit()
    return wh
