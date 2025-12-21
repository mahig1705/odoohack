from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.appointment import Appointment
from app.services.appointment_status_service import log_status_change
from app.services.razorpay_service import create_order, verify_signature
from app.core.config import settings
from uuid import UUID
from typing import Dict, Any


def create_payment(db: Session, data):
    appointment = db.query(Appointment).filter(
        Appointment.id == data.appointment_id
    ).first()

    if not appointment:
        raise Exception("Appointment not found")

    # For backward compatibility: if payment_method is 'offline' or demo, keep original behavior
    if getattr(data, "payment_method", "") and data.payment_method.lower() in ("offline", "cash", "manual"):
        payment = Payment(
            appointment_id=data.appointment_id,
            amount=data.amount,
            payment_method=data.payment_method,
            status="SUCCESS",
            transaction_ref="TXN-DEMO-123"
        )

        old_status = appointment.status
        appointment.status = "CONFIRMED"

        db.add(payment)
        db.commit()
        db.refresh(payment)

        # 🔥 LOG STATUS CHANGE
        log_status_change(
            db=db,
            appointment_id=appointment.id,
            old_status=old_status,
            new_status="CONFIRMED",
            user_id=appointment.user_id
        )

        return payment

    # If payment_method indicates online (razorpay), create a PENDING payment record and a Razorpay order
    # Create local payment record with PENDING
    payment = Payment(
        appointment_id=data.appointment_id,
        amount=data.amount,
        payment_method=data.payment_method,
        status="PENDING",
        transaction_ref=None
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Create Razorpay order
    try:
        order = create_order(float(data.amount), currency="INR", receipt=str(payment.id))
        # persist order id (Razorpay order id) in transaction_ref for lookup by webhook
        payment.transaction_ref = order.get("id")
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "payment": payment,
            "order": order
        }
    except Exception as e:
        # Mark payment failed
        payment.status = "FAILED"
        db.add(payment)
        db.commit()
        db.refresh(payment)
        raise
