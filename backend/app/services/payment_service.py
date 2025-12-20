from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.appointment import Appointment

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

    appointment.status = "CONFIRMED"

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment
