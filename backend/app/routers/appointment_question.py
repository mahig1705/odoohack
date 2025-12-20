from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.appointment_question import AppointmentQuestionCreate
from app.services.appointment_question_service import create_question
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/appointment-questions", tags=["Appointment Questions"])

@router.post("/")
def add_question(
    data: AppointmentQuestionCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return create_question(db, data)
