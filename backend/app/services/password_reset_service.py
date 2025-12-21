import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.core.security import hash_password
from app.core.email import send_email


def request_password_reset(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Do NOT reveal user existence
        return {"message": "If the email exists, OTP has been sent"}

    # Generate OTP
    otp = str(secrets.randbelow(899999) + 100000)

    # Mark old tokens as used
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({PasswordResetToken.used: True})

    # Create new token
    token = PasswordResetToken(
        user_id=user.id,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False
    )

    db.add(token)
    db.commit()
    db.refresh(token)

    # Send OTP email
    send_email(
    to_email=user.email,
    subject="Password Reset OTP",
    body=f"Your OTP for resetting your password is: {otp}"
)


    return {"message": "OTP sent to your email"}
    


def verify_password_reset_otp(db: Session, email: str, otp: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.otp == otp,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Generate temporary reset token
    reset_token = secrets.token_hex(32)

    # Save it
    token.reset_token = reset_token
    token.used = True  # Mark OTP as used
    db.commit()

    return {"reset_token": reset_token}



def reset_password(db: Session, reset_token: str, new_password: str):
    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.reset_token == reset_token,
        PasswordResetToken.used == True
    ).first()

    if not token:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    if token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token expired")

    user = db.query(User).filter(User.id == token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # Set new password
    user.password_hash = hash_password(new_password)
    db.commit()

    return {"message": "Password reset successful"}
