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

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = create_user(db, data.full_name, data.email, data.password)
    generate_and_send_otp(db, user.id, user.email)
    return {"message": "User registered. OTP sent to email."}

from app.models.user import User

from app.models.user import User

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