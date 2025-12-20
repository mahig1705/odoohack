from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.appointment_status_history import AppointmentStatusHistory
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/appointment-status", tags=["Appointment Audit"])

@router.get("/{appointment_id}")
def get_history(
    appointment_id,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return db.query(AppointmentStatusHistory).filter(
        AppointmentStatusHistory.appointment_id == appointment_id
    ).all()
