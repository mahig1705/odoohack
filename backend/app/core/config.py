from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str
    SMTP_PASSWORD: str
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None

    class Config:
        # Prefer a project-level .env located at backend/.env (robust for different CWDs)
        env_file = os.getenv("ENV_FILE") or str(
            Path(__file__).resolve().parents[3] / ".env"
        )


settings = Settings()

# Log whether Razorpay keys are present (non-sensitive check)
try:
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        logger.info("Razorpay keys loaded from %s", Settings.Config.env_file)
    else:
        logger.warning("Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env")
except Exception:
    # Avoid failing import due to logging issues
    pass
