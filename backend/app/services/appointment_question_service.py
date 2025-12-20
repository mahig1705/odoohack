from sqlalchemy.orm import Session
from app.models.appointment_question import AppointmentQuestion

def create_question(db: Session, data):
    q = AppointmentQuestion(**data.dict())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q
