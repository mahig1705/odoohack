from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.payment import PaymentCreate
from app.services.payment_service import create_payment
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/")
def pay(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("CUSTOMER"))

):
    try:
        payment = create_payment(db, data)
        return {
            "payment_id": str(payment.id),
            "status": payment.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
