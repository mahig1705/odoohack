from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.services.cancel_service import cancel_appointment
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/appointments", tags=["Cancellation"])

@router.post("/{appointment_id}/cancel")
def cancel(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    try:
        cancel_appointment(db, appointment_id, current_user.id)
        return {"message": "Appointment cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
