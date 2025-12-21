import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.otp import OTPVerification
from app.core.email import send_otp_email
import logging

logger = logging.getLogger(__name__)

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def check_rate_limit(db: Session, user_id, minutes: int = 1) -> bool:
    """Check if user has requested OTP within the last N minutes (rate limiting)"""
    one_minute_ago = datetime.utcnow() - timedelta(minutes=minutes)
    
    recent_otp = db.query(OTPVerification).filter(
        OTPVerification.user_id == user_id,
        OTPVerification.expires_at > one_minute_ago
    ).first()
    
    return recent_otp is not None

def generate_and_send_otp(db: Session, user_id, email: str, purpose: str = "verification"):
    """
    Generate OTP, save to database, and send email.
    Includes rate limiting (1 per minute).
    """
    try:
        # Rate limiting: check if OTP was sent in the last minute
        if check_rate_limit(db, user_id, minutes=1):
            logger.warning(f"Rate limit: OTP request for user {user_id} within last minute")
            raise Exception("Please wait 1 minute before requesting another OTP")
        
        # Generate 6-digit OTP
        otp = generate_otp()
        
        # Create OTP record
        record = OTPVerification(
            user_id=user_id,
            otp_code=otp,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            verified=False
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Send email
        try:
            send_otp_email(email, otp, purpose)
            logger.info(f"OTP sent successfully to {email} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to send OTP email to {email}: {e}")
            # Don't fail the whole request if email fails, but log it
            raise Exception(f"Failed to send email: {e}")
        
        return otp
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating/sending OTP for user {user_id}: {e}")
        raise
