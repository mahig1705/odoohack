from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.payment import PaymentCreate, CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from app.services.payment_service import create_payment
from app.services.razorpay_service import verify_signature
from app.dependencies.auth import get_current_user
from app.models.payment import Payment
from app.models.appointment import Appointment
from app.services.appointment_status_service import log_status_change
from app.dependencies.roles import require_roles
from fastapi import Body
from fastapi import Request
from app.services.razorpay_service import verify_webhook_signature
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/")
def pay(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("CUSTOMER"))
):
    """Legacy/demo payment endpoint (keeps existing behavior)."""
    try:
        payment = create_payment(db, data)
        # If create_payment returned a dict (online flow), return order details
        if isinstance(payment, dict):
            return {
                "payment_id": str(payment["payment"].id),
                "order": payment["order"]
            }
        return {
            "payment_id": str(payment.id),
            "status": payment.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Razorpay webhook endpoint. Verifies signature and updates payment and appointment status."""
    try:
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not secret:
            raise HTTPException(status_code=400, detail="Webhook secret not configured")

        signature = request.headers.get("X-Razorpay-Signature")
        body = await request.body()

        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature header")

        valid = verify_webhook_signature(body, signature, secret)
        if not valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        payload = await request.json()
        event = payload.get("event")

        # For payment captured / authorized events
        if event and event.startswith("payment"):
            # navigate into payload to find order_id and payment entity
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity")
            if payment_entity:
                razorpay_order_id = payment_entity.get("order_id")
                razorpay_payment_id = payment_entity.get("id")
                status = payment_entity.get("status")

                # Find local payment by transaction_ref (we stored order id there)
                db = None
                try:
                    from app.database import SessionLocal
                    db = SessionLocal()
                    from app.models.payment import Payment as PaymentModel
                    from app.models.appointment import Appointment as AppointmentModel

                    payment = db.query(PaymentModel).filter(PaymentModel.transaction_ref == razorpay_order_id).first()
                    if payment:
                        if status in ("captured", "authorized"):
                            payment.status = "SUCCESS"
                            payment.transaction_ref = razorpay_payment_id
                            db.add(payment)

                            # Update appointment
                            appointment = db.query(AppointmentModel).filter(AppointmentModel.id == payment.appointment_id).first()
                            if appointment:
                                old_status = appointment.status
                                appointment.status = "CONFIRMED"
                                db.add(appointment)
                                from app.services.appointment_status_service import log_status_change
                                log_status_change(db=db, appointment_id=appointment.id, old_status=old_status, new_status="CONFIRMED", user_id=appointment.user_id)

                            db.commit()
                finally:
                    if db:
                        db.close()

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        print("Webhook processing error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order_endpoint(
    data: CreateOrderRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles("CUSTOMER"))
):
    """Create a payment record and a Razorpay order. Returns order_id and key id for frontend checkout."""
    try:
        # construct a service-friendly object with payment_method set to 'razorpay'
        service_input = type("SvcObj", (), {})()
        service_input.appointment_id = data.appointment_id
        service_input.amount = data.amount
        service_input.payment_method = "razorpay"

        result = create_payment(db, service_input)
        # create_payment will return dict with payment and order for online flow
        if not isinstance(result, dict):
            raise Exception("Failed to create order")

        payment = result["payment"]
        order = result["order"]

        from app.core.config import settings

        return CreateOrderResponse(
            payment_id=payment.id,
            order_id=order.get("id"),
            amount=order.get("amount"),
            currency=order.get("currency"),
            key_id=settings.RAZORPAY_KEY_ID or ""
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify")
def verify_payment(
    data: VerifyPaymentRequest = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles("CUSTOMER"))
):
    """Verify Razorpay payment signature and update payment + appointment status."""
    try:
        params = {
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        }

        valid = verify_signature(params)
        payment = db.query(Payment).filter(Payment.id == data.payment_id).first()
        if not payment:
            raise Exception("Payment record not found")

        if not valid:
            payment.status = "FAILED"
            db.add(payment)
            db.commit()
            db.refresh(payment)
            raise Exception("Invalid payment signature")

        # mark success
        payment.status = "SUCCESS"
        payment.transaction_ref = data.razorpay_payment_id
        db.add(payment)

        # Confirm appointment
        appointment = db.query(Appointment).filter(Appointment.id == payment.appointment_id).first()
        if appointment:
            old_status = appointment.status
            appointment.status = "CONFIRMED"
            db.add(appointment)
            log_status_change(db=db, appointment_id=appointment.id, old_status=old_status, new_status="CONFIRMED", user_id=appointment.user_id)

        db.commit()
        db.refresh(payment)

        return {"success": True, "payment_id": str(payment.id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
