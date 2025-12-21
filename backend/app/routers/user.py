from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = (
        db.query(Role.name)
        .join(UserRole, Role.id == UserRole.role_id)
        .filter(UserRole.user_id == current_user.id)
        .all()
    )
    user_roles = [r[0] for r in roles]
    
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=user_roles
    )


@router.patch("/me", response_model=UserResponse)
def update_current_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.email is not None:
        existing = db.query(User).filter(User.email == user_update.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    roles = (
        db.query(Role.name)
        .join(UserRole, Role.id == UserRole.role_id)
        .filter(UserRole.user_id == current_user.id)
        .all()
    )
    user_roles = [r[0] for r in roles]

    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=user_roles
    )

