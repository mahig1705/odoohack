from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.services.resource_service import (
    create_resource,
    toggle_resource_status,
    assign_resource_to_appointment,
    get_resources_for_appointment
)
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.post("/", response_model=ResourceResponse)
def create(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("ORGANISER", "ADMIN"))
):
    return create_resource(db, data, _.id)


@router.post("/{resource_id}/toggle")
def toggle(
    resource_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("ORGANISER", "ADMIN"))
):
    resource = toggle_resource_status(db, resource_id, _.id)

    if not resource:
        raise HTTPException(404, "Resource not found")

    return {"message": "Resource status updated"}



@router.post("/assign")
def assign(
    appointment_type_id: UUID,
    resource_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("ORGANISER", "ADMIN"))
):
    assign_resource_to_appointment(db, appointment_type_id, resource_id)
    return {"message": "Resource assigned to appointment type"}



@router.get("/appointment/{appointment_type_id}", response_model=list[ResourceResponse])
def list_for_appointment(
    appointment_type_id: UUID,
    db: Session = Depends(get_db)
):
    return get_resources_for_appointment(db, appointment_type_id)
