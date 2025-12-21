from pydantic import BaseModel
from uuid import UUID

class PaymentCreate(BaseModel):
    appointment_id: UUID
    amount: float
    payment_method: str


class CreateOrderRequest(BaseModel):
    appointment_id: UUID
    amount: float
    currency: str = "INR"


class CreateOrderResponse(BaseModel):
    payment_id: UUID
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    payment_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
