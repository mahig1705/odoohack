from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.appointment_answer import AppointmentAnswerCreate
from app.services.appointment_answer_service import submit_answer
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/appointment-answers", tags=["Appointment Answers"])

@router.post("/")
def submit(
    data: AppointmentAnswerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    submit_answer(db, data)
    return {"message": "Answer saved"}
