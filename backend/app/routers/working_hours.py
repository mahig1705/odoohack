from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.working_hours import WorkingHoursCreate
from app.services.working_hours_service import create_working_hours
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/working-hours", tags=["Working Hours"])

@router.post("/")
def add_working_hours(
    data: WorkingHoursCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    create_working_hours(db, data)
    return {"message": "Working hours added"}
