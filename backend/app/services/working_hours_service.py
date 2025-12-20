from sqlalchemy.orm import Session
from app.models.working_hours import WorkingHours

def create_working_hours(db: Session, data):
    wh = WorkingHours(**data.dict())
    db.add(wh)
    db.commit()
    return wh
