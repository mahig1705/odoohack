from pydantic import BaseModel
from uuid import UUID

class PaymentCreate(BaseModel):
    appointment_id: UUID
    amount: float
    payment_method: str
