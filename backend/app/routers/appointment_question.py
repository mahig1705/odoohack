from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.schemas.appointment_question import AppointmentQuestionCreate, AppointmentQuestionResponse
from app.services.appointment_question_service import create_question
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.appointment_question import AppointmentQuestion

router = APIRouter(prefix="/appointment-questions", tags=["Appointment Questions"])

@router.post("/")
def add_question(
    data: AppointmentQuestionCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("CUSTOMER"))

):
    return create_question(db, data)

@router.get("/{appointment_type_id}", response_model=list[AppointmentQuestionResponse])
def get_questions(
    appointment_type_id: UUID,
    db: Session = Depends(get_db)
):
    questions = db.query(AppointmentQuestion).filter(
        AppointmentQuestion.appointment_type_id == appointment_type_id
    ).all()
    
    return questions
