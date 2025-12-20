
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services.role_service import assign_role, remove_role, get_user_roles
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/assign")
def assign(
    user_id: UUID,
    role: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_roles("ADMIN"))
):
    result = assign_role(db, user_id, role.upper())

    if result is None:
        raise HTTPException(404, "Role not found")

    if result == "exists":
        return {"message": "Role already assigned"}

    return {"message": "Role assigned successfully"}


@router.post("/remove")
def remove(
    user_id: UUID,
    role: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_roles("ADMIN"))
):
    result = remove_role(db, user_id, role.upper())

    if result is None:
        raise HTTPException(404, "Role not found")

    if result == "missing":
        return {"message": "User does not have this role"}

    return {"message": "Role removed successfully"}


@router.get("/{user_id}")
def list_roles(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: str = Depends(require_roles("ADMIN"))
):
    roles = get_user_roles(db, user_id)
    return {"roles": [r[0] for r in roles]}
