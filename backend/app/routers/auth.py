from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, 
    LoginRequest, 
    OTPVerifyRequest,
    EmailVerifyRequest,
    PasswordResetRequest,
    PasswordResetOTPVerify,
    PasswordReset
)
from app.services.auth_service import create_user, authenticate_user
from app.services.otp_service import generate_and_send_otp
from app.services.password_reset_service import (
    request_password_reset,
    verify_password_reset_otp,
    reset_password
)
from app.models.otp import OTPVerification
from app.models.password_reset_token import PasswordResetToken  # Ensure table is created
from datetime import datetime
from app.core.security import create_access_token
from app.schemas.token import TokenResponse
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])
ALLOWED_SIGNUP_ROLES = {"CUSTOMER", "ORGANISER"}

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

    try:
        generate_and_send_otp(db, user.id, user.email, purpose="email_verification")
        return {"message": "User registered. OTP sent to email."}
    except Exception as e:
        # Log error but don't fail registration
        import logging
        logging.error(f"Failed to send OTP during registration: {e}")
        return {"message": "User registered. Please request OTP from verify email page."}

@router.post("/resend-verification-otp")
def resend_verification_otp(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Resend verification OTP to user's email"""
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        # Don't reveal if user exists (security)
        return {"message": "If the email exists, a verification code has been sent"}
    
    if user.is_verified:
        return {"message": "Email is already verified"}
    
    try:
        generate_and_send_otp(db, user.id, user.email, purpose="email_verification")
        return {"message": "Verification code sent to email"}
    except Exception as e:
        import logging
        logging.error(f"Failed to resend verification OTP: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-email")
def verify_email(data: EmailVerifyRequest, db: Session = Depends(get_db)):
    """Verify email using OTP after registration"""
    # 1️⃣ Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2️⃣ Find OTP record for this user
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.user_id == user.id,
        OTPVerification.otp_code == data.otp,
        OTPVerification.verified == False
    ).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired")

    # 3️⃣ Mark OTP as verified
    otp_record.verified = True

    # 4️⃣ Mark user as verified
    user.is_verified = True

    db.commit()
    
    # 5️⃣ Assign role if not already assigned
    existing_role = db.query(UserRole).filter(UserRole.user_id == user.id).first()
    if not existing_role:
        user_count = db.query(User).count()
        if user_count == 1:
            # 👑 FIRST USER → ADMIN
            admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
            if admin_role:
                db.add(UserRole(user_id=user.id, role_id=admin_role.id))
        else:
            # 👤 ASSIGN REQUESTED ROLE
            role_name = user.requested_role or "CUSTOMER"
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                db.add(UserRole(user_id=user.id, role_id=role.id))
        db.commit()

<<<<<<< HEAD

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
=======
>>>>>>> main
    return {"message": "Email verified successfully"}



@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email before logging in. Check your email for the OTP code."
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/request-password-reset")
def request_password_reset_endpoint(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Step 1: Request password reset - sends OTP to email"""
    try:
        result = request_password_reset(db, data.email)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-password-reset-otp")
def verify_password_reset_otp_endpoint(data: PasswordResetOTPVerify, db: Session = Depends(get_db)):
    """Step 2: Verify OTP and get reset token"""
    try:
        result = verify_password_reset_otp(db, data.email, data.otp)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reset-password")
def reset_password_endpoint(data: PasswordReset, db: Session = Depends(get_db)):
    """Step 3: Reset password using reset token"""
    try:
        result = reset_password(db, data.reset_token, data.new_password)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))