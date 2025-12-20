from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from app.database import get_db
from app.schemas.slot import SlotGenerateRequest, SlotResponse
from app.services.slot_service import generate_slots
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.models.slot import Slot
from app.models.appointment_type import AppointmentType

router = APIRouter(prefix="/slots", tags=["Slots"])

@router.post("/generate")
def generate_slots_api(
    data: SlotGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ORGANISER", "ADMIN"))
):
    """Generate slots for a date. Organizer-only endpoint.

    Additionally enforce that the authenticated organizer actually owns the
    `AppointmentType` being targeted. Admins can generate for any appointment
    type.
    """
    # Verify appointment type exists and ownership for non-admins
    apt = db.query(AppointmentType).filter(AppointmentType.id == data.appointment_type_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment type not found")

    # `current_user.role` may not exist for all setups; treat presence of 'ADMIN' role as override
    is_admin = getattr(current_user, "role", None) == "ADMIN"
    if not is_admin and getattr(apt, "created_by", None) != getattr(current_user, "id", None):
        raise HTTPException(status_code=403, detail="Not authorized to generate slots for this appointment type")

    try:
        generate_slots(db, data.appointment_type_id, data.slot_date)
        return {"message": "Slots generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=list[SlotResponse])
def get_slots(
    appointment_type_id: UUID = Query(..., description="Appointment type ID"),
    slot_date: date = Query(..., description="Date to get slots for"),
    db: Session = Depends(get_db)
):
    slots = db.query(Slot).filter(
        Slot.appointment_type_id == appointment_type_id,
        Slot.slot_date == slot_date
    ).all()
    
    return slots


@router.get("/appointment/{appointment_type_id}/date/{slot_date}", response_model=list[SlotResponse])
def get_slots_by_appointment_and_date(
    appointment_type_id: UUID,
    slot_date: date,
    db: Session = Depends(get_db)
):
    """Path-style endpoint for compatibility with frontend client.

    Returns the list of slots for the given appointment type and date.
    """
    slots = db.query(Slot).filter(
        Slot.appointment_type_id == appointment_type_id,
        Slot.slot_date == slot_date
    ).all()

    return slots
