from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.dependencies.auth import get_current_user

def require_roles(*allowed_roles):
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        roles = (
            db.query(Role.name)
            .join(UserRole, Role.id == UserRole.role_id)
            .filter(UserRole.user_id == current_user.id)
            .all()
        )

        user_roles = {r[0] for r in roles}

        if not user_roles.intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to perform this action"
            )

        return current_user

    return role_checker
