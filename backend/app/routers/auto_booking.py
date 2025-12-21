from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auto_booking import AutoBookingRequest, AutoBookingResponse
from app.services.auto_booking_service import create_auto_booking
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/auto-book", tags=["Auto Booking"])


@router.post("/", response_model=AutoBookingResponse)
def auto_book(
    data: AutoBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))
):
    """Automatically book the nearest available appointment based on user location and appointment type"""
    try:
        print(f"DEBUG auto-book API: Request received - user={current_user.id}, appointment_type={data.appointment_type_id}, location=({data.latitude}, {data.longitude})")
        
        result = create_auto_booking(
            db=db,
            user_id=current_user.id,
            appointment_type_id=data.appointment_type_id,
            latitude=data.latitude,
            longitude=data.longitude
        )
        
        appointment = result["appointment"]
        resource = result["resource"]
        slot = result["slot"]
        
        print(f"DEBUG auto-book API: Booking successful - appointment_id={appointment.id}")
        
        return AutoBookingResponse(
            appointment_id=appointment.id,
            resource_name=resource.name,
            start_time=slot.start_time.strftime("%H:%M"),
            end_time=slot.end_time.strftime("%H:%M"),
            message=f"Appointment booked successfully at {resource.name} on {slot.slot_date.strftime('%Y-%m-%d')} from {slot.start_time.strftime('%H:%M')} to {slot.end_time.strftime('%H:%M')}"
        )
    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG auto-book API: Error - {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

