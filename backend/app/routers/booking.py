from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import create_booking
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.models.appointment_type import AppointmentType
from app.models.slot import Slot
from app.dependencies.roles import require_roles
from sqlalchemy.orm import joinedload


router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/")
def book_slot(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CUSTOMER"))

):
    try:
        appointment = create_booking(db, current_user.id, data)
        return {
            "appointment_id": str(appointment.id),
            "status": appointment.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my", response_model=list[BookingResponse])
def get_my_bookings(
    current_user: User = Depends(require_roles("CUSTOMER")),
    db: Session = Depends(get_db)
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )
    
    result = []
    for apt in appointments:
        slot = db.query(Slot).filter(Slot.id == apt.slot_id).first()
        apt_type = db.query(AppointmentType).filter(AppointmentType.id == apt.appointment_type_id).first()
        
        result.append(BookingResponse(
            id=apt.id,
            appointment_type_id=apt.appointment_type_id,
            slot_id=apt.slot_id,
            user_id=apt.user_id,
            people_count=apt.people_count,
            status=apt.status,
            created_at=apt.created_at,
            appointment_type_name=apt_type.name if apt_type else "",
            slot_date=slot.slot_date.isoformat() if slot else "",
            start_time=slot.start_time.strftime("%H:%M") if slot else "",
            end_time=slot.end_time.strftime("%H:%M") if slot else "",
            booked_by=current_user.full_name
        ))
    
    return result

@router.get("/all", response_model=list[BookingResponse])
def get_all_bookings(
    current_user: User = Depends(require_roles("ORGANISER", "ADMIN")),
    db: Session = Depends(get_db)
):
    appointments = (
        db.query(Appointment)
        .order_by(Appointment.created_at.desc())
        .all()
    )
    
    result = []
    for apt in appointments:
        slot = db.query(Slot).filter(Slot.id == apt.slot_id).first()
        apt_type = db.query(AppointmentType).filter(AppointmentType.id == apt.appointment_type_id).first()
        user = db.query(User).filter(User.id == apt.user_id).first()
        
        result.append(BookingResponse(
            id=apt.id,
            appointment_type_id=apt.appointment_type_id,
            slot_id=apt.slot_id,
            user_id=apt.user_id,
            people_count=apt.people_count,
            status=apt.status,
            created_at=apt.created_at,
            appointment_type_name=apt_type.name if apt_type else "",
            slot_date=slot.slot_date.isoformat() if slot else "",
            start_time=slot.start_time.strftime("%H:%M") if slot else "",
            end_time=slot.end_time.strftime("%H:%M") if slot else "",
            booked_by=user.full_name if user else ""
        ))
    
    return result
