from app.core.config import settings
import razorpay
from typing import Dict, Any


def get_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise Exception("Razorpay keys not configured")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(amount: float, currency: str = "INR", receipt: str | None = None) -> Dict[str, Any]:
    """Create a Razorpay order. Amount should be in rupees; the SDK expects paise."""
    client = get_client()
    if receipt is None:
        import time
        receipt = f"rcpt_{int(time.time())}"

    payload = {
        "amount": int(round(amount * 100)),
        "currency": currency,
        "receipt": receipt,
        "payment_capture": 1,
    }

    order = client.order.create(data=payload)
    return order


def verify_signature(params: dict) -> bool:
    """Verify the Razorpay payment signature using SDK utility."""
    client = get_client()
    try:
        client.utility.verify_payment_signature(params)
        return True
    except Exception:
        return False


def verify_webhook_signature(body: bytes, signature: str, webhook_secret: str) -> bool:
    """Verify Razorpay webhook signature using SDK utility."""
    client = get_client()
    try:
        client.utility.verify_webhook_signature(body, signature, webhook_secret)
        return True
    except Exception:
        return False
