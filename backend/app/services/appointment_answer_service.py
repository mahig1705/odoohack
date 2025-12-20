from sqlalchemy.orm import Session
from app.models.appointment_answer import AppointmentAnswer

def submit_answer(db: Session, data):
    ans = AppointmentAnswer(**data.dict())
    db.add(ans)
    db.commit()
    return ans
