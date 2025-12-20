from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(20), default="PENDING")  # PENDING / SUCCESS / FAILED

    payment_method = Column(String(30))  # card / upi / netbanking
    transaction_ref = Column(String(100))

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
