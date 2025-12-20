from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.core.security import hash_password, verify_password


def create_user(db: Session, full_name: str, email: str, password: str, role_intent="CUSTOMER"):
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        is_verified=False,
        requested_role=role_intent
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
        return user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    # 🚫 BLOCK LOGIN IF OTP NOT VERIFIED
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please verify OTP."
        )

    return user
