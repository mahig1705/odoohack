from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, OTPVerifyRequest
from app.services.auth_service import create_user, authenticate_user
from app.services.otp_service import generate_and_send_otp
from app.models.otp import OTPVerification
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = create_user(db, data.full_name, data.email, data.password)
    generate_and_send_otp(db, user.id, user.email)
    return {"message": "User registered. OTP sent to email."}

@router.post("/verify-otp")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    otp = db.query(OTPVerification).filter(
        OTPVerification.otp_code == data.otp,
        OTPVerification.verified == False
    ).first()

    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired OTP")

    otp.verified = True
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    return {"message": "Login successful"}
