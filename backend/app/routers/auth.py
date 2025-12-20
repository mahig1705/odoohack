from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, OTPVerifyRequest
from app.services.auth_service import create_user, authenticate_user
from app.services.otp_service import generate_and_send_otp
from app.models.otp import OTPVerification
from datetime import datetime
from app.core.security import create_access_token
from app.schemas.token import TokenResponse
from app.models.role import Role
from app.models.user_role import UserRole
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    role_requested = data.role.upper()

    if role_requested not in ALLOWED_SIGNUP_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role selection")

    user = create_user(
        db,
        data.full_name,
        data.email,
        data.password,
        role_requested
    )

    generate_and_send_otp(db, user.id, user.email)
    return {"message": "User registered. OTP sent to email."}

from app.models.user import User

from app.models.user import User
ALLOWED_SIGNUP_ROLES = {"CUSTOMER", "ORGANISER"}
@router.post("/verify-otp")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    # 1️⃣ Find OTP record
    otp = db.query(OTPVerification).filter(
        OTPVerification.otp_code == data.otp,
        OTPVerification.verified == False
    ).first()

    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # 2️⃣ Mark OTP as verified
    otp.verified = True

    # 3️⃣ Fetch user using otp.user_id
    user = db.query(User).filter(User.id == otp.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 4️⃣ Mark user as verified
    user.is_verified = True

    db.commit()
    user_count = db.query(User).count()


    if user_count == 1:
        # 👑 FIRST USER → ADMIN
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        db.add(UserRole(user_id=user.id, role_id=admin_role.id))
    else:
        # 👤 ASSIGN REQUESTED ROLE
        role_name = user.requested_role or "CUSTOMER"
        role = db.query(Role).filter(Role.name == role_name).first()
        db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()
    return {"message": "Email verified successfully"}



@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }