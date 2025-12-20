from sqlalchemy.orm import Session
from app.models.user_role import UserRole
from app.models.role import Role

def assign_role(db: Session, user_id, role_name: str):
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        return None

    exists = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role.id
    ).first()

    if exists:
        return "exists"

    mapping = UserRole(
        user_id=user_id,
        role_id=role.id
    )
    db.add(mapping)
    db.commit()
    return mapping


def remove_role(db: Session, user_id, role_name: str):
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        return None

    mapping = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role.id
    ).first()

    if not mapping:
        return "missing"

    db.delete(mapping)
    db.commit()
    return True


def get_user_roles(db: Session, user_id):
    return (
        db.query(Role.name)
        .join(UserRole, Role.id == UserRole.role_id)
        .filter(UserRole.user_id == user_id)
        .all()
    )
