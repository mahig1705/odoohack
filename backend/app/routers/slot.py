from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from app.database import get_db
from app.schemas.slot import SlotGenerateRequest, SlotResponse
from app.services.slot_service import generate_slots
from app.dependencies.auth import get_current_user
from app.models.slot import Slot

router = APIRouter(prefix="/slots", tags=["Slots"])

@router.post("/generate")
def generate_slots_api(
    data: SlotGenerateRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
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
