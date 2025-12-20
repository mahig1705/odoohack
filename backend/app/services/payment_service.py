from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.appointment import Appointment
from app.services.appointment_status_service import log_status_change


def create_payment(db: Session, data):
    appointment = db.query(Appointment).filter(
        Appointment.id == data.appointment_id
    ).first()

    if not appointment:
        raise Exception("Appointment not found")

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
