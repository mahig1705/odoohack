from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.booking import BookingCreate
from app.services.booking_service import create_booking
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/")
def book_slot(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        appointment = create_booking(db, current_user.id, data)
        return {
            "appointment_id": str(appointment.id),
            "status": appointment.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
