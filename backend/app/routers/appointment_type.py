from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.dependencies.roles import require_roles

from app.database import get_db
from app.schemas.appointment_type import (
    AppointmentTypeCreate,
    AppointmentTypeResponse
)
from app.services.appointment_type_service import (
    create_appointment_type,
    publish_appointment_type
)
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.appointment_type import AppointmentType

router = APIRouter(prefix="/appointment-types", tags=["Appointment Types"])


@router.post("/", response_model=AppointmentTypeResponse)
def create(
    data: AppointmentTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ORGANISER", "ADMIN"))

):
    return create_appointment_type(db, data, current_user.id)


@router.post("/{appointment_id}/publish", response_model=AppointmentTypeResponse)
def publish(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ORGANISER", "ADMIN"))

):
    appointment = publish_appointment_type(db, appointment_id, current_user.id)

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return appointment

@router.get("/public", response_model=list[AppointmentTypeResponse])
def list_published(db: Session = Depends(get_db)):
    return db.query(AppointmentType).filter(
        AppointmentType.is_published == True
    ).all()

@router.get("/my", response_model=list[AppointmentTypeResponse])
def list_my_appointments(
    current_user: User = Depends(require_roles("ORGANISER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Get all appointment types created by the current organizer"""
    return db.query(AppointmentType).filter(
        AppointmentType.created_by == current_user.id
    ).order_by(AppointmentType.created_at.desc()).all()