import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    """
    Send email using SMTP with TLS on port 587.
    Proper error handling and logging.
    """
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_EMAIL
        msg["To"] = to_email
        
        # Add body
        if is_html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))
        
        # Connect to server and send
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()  # Enable TLS encryption
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}. Make sure you're using an App Password for Gmail, not your regular password.")
        raise Exception(f"Email authentication failed: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending email to {to_email}: {e}")
        raise Exception(f"Failed to send email: {e}")
    except Exception as e:
        logger.error(f"Unexpected error sending email to {to_email}: {e}")
        raise Exception(f"Failed to send email: {e}")

def send_otp_email(to_email: str, otp: str, purpose: str = "verification"):
    """Send OTP email for email verification or password reset"""
    subject = "Your OTP Verification Code"
    body = f"""Your OTP verification code is: {otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.
"""
    try:
        send_email(to_email, subject, body)
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        raise
