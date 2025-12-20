from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.schemas.working_hours import WorkingHoursCreate, WorkingHoursResponse
from app.services.working_hours_service import (
    create_working_hours,
    get_working_hours_for_appointment,
    delete_working_hours
)
from app.dependencies.auth import get_current_user
from app.models.working_hours import WorkingHours

router = APIRouter(prefix="/working-hours", tags=["Working Hours"])

@router.get("/appointment/{appointment_type_id}", response_model=list[WorkingHoursResponse])
def get_working_hours(
    appointment_type_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all working hours for an appointment type"""
    return get_working_hours_for_appointment(db, appointment_type_id)

@router.post("/")
def add_working_hours(
    data: WorkingHoursCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    create_working_hours(db, data)
    return {"message": "Working hours added"}

@router.delete("/{working_hours_id}")
def delete(
    working_hours_id: UUID,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Delete working hours"""
    result = delete_working_hours(db, working_hours_id)
    if not result:
        raise HTTPException(status_code=404, detail="Working hours not found")
    return {"message": "Working hours deleted"}
