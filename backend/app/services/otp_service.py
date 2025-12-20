import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.otp import OTPVerification
from app.core.email import send_otp_email

def generate_and_send_otp(db: Session, user_id, email):
    otp = str(random.randint(100000, 999999))
    record = OTPVerification(
        user_id=user_id,
        otp_code=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(record)
    db.commit()
    send_otp_email(email, otp)
