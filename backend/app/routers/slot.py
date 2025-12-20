from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.slot import SlotGenerateRequest
from app.services.slot_service import generate_slots
from app.dependencies.auth import get_current_user

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
