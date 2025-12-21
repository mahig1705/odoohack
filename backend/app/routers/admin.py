from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.appointment import Appointment
from app.models.appointment_type import AppointmentType
from app.models.slot import Slot
from app.schemas.booking import BookingResponse
from app.dependencies.roles import require_roles
from app.models.user import User
router = APIRouter(prefix="/admin", tags=["Admin"])


# =========================
# ADMIN DASHBOARD STATS
# =========================
from app.models.user_role import UserRole
from app.models.role import Role

from sqlalchemy import func
from app.models.user import User

from app.models.resource import Resource
from app.models.user import User
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/recent-users")
def get_recent_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "status": "Active" if user.is_active else "Inactive",
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.dependencies.roles import require_roles

router = APIRouter(prefix="/admin", tags=["Admin"])
@router.get("/reports/transactions/summary")
def transaction_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    total_transactions = db.query(Payment).count()
    successful = db.query(Payment).filter(Payment.status == "SUCCESS").count()
    failed = db.query(Payment).filter(Payment.status == "FAILED").count()

    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    return {
        "total_transactions": total_transactions,
        "successful": successful,
        "failed": failed,
        "total_revenue": float(total_revenue),
    }


@router.get("/recent-users")
def get_recent_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "status": (
                "ACTIVE" if user.is_active
                else "PENDING" if not user.is_verified
                else "INACTIVE"
            ),
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]

@router.get("/recent-providers")
def get_recent_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    providers = (
        db.query(User)
        .filter(User.requested_role == "ORGANISER")
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "id": provider.id,
            "name": provider.full_name,
            "category": "Service Provider",  # placeholder (see note below)
            "status": "Active" if provider.is_active else "Inactive",
            "created_at": provider.created_at.isoformat(),
        }
        for provider in providers
    ]

@router.get("/resources")
def get_all_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    resources = db.query(Resource).all()

    result = []
    for r in resources:
        owner = db.query(User).filter(User.id == r.created_by).first()

        result.append({
            "id": str(r.id),
            "name": r.name,
            "capacity": r.capacity,
            "is_active": r.is_active,

            # ✅ keep ID for internal use
            "created_by_id": str(r.created_by) if r.created_by else None,

            # ✅ human-readable fields for UI
            "created_by_name": owner.full_name if owner else "—",
            "created_by_email": owner.email if owner else "—",
        })

    return result


@router.patch("/resources/{resource_id}/status")
def toggle_resource_status(
    resource_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.is_active = payload.get("is_active", resource.is_active)
    db.commit()

    return {"message": "Resource status updated"}


@router.get("/providers")
def get_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    providers = (
        db.query(User)
        .filter(User.requested_role == "ORGANISER")
        .all()
    )

    result = []

    for p in providers:
        bookings_count = (
            db.query(Appointment)
            .join(AppointmentType, Appointment.appointment_type_id == AppointmentType.id)
            .filter(AppointmentType.created_by == p.id)
            .count()
        )

        result.append({
            "id": str(p.id),
            "name": p.full_name,
            "email": p.email,
            "is_active": p.is_active,
            "status": "Active" if p.is_active else "Inactive",
            "bookings": bookings_count,
            "created_at": p.created_at.isoformat(),
            "type": "Service Provider",
            "rating": None,  # future
            "location": "—", # optional
        })

    return result
@router.get("/providers/stats")
def provider_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    total = db.query(User).filter(User.requested_role == "ORGANISER").count()
    active = db.query(User).filter(
        User.requested_role == "ORGANISER",
        User.is_active == True
    ).count()
    inactive = db.query(User).filter(
        User.requested_role == "ORGANISER",
        User.is_active == False
    ).count()

    pending = 0  # if you add approval flow later

    return {
        "total": total,
        "active": active,
        "pending": pending,
        "inactive": inactive,
    }

@router.patch("/providers/{provider_id}/status")
def update_provider_status(
    provider_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.is_active = payload.get("is_active", provider.is_active)
    db.commit()

    return {"message": "Provider status updated"}


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    total_users = db.query(User).count()

    organiser_role = db.query(Role).filter(Role.name == "ORGANISER").first()
    customer_role = db.query(Role).filter(Role.name == "CUSTOMER").first()

    total_organizers = (
        db.query(UserRole)
        .filter(UserRole.role_id == organiser_role.id)
        .count()
    ) if organiser_role else 0

    total_customers = (
        db.query(UserRole)
        .filter(UserRole.role_id == customer_role.id)
        .count()
    ) if customer_role else 0

    total_bookings = db.query(Appointment).count()
    total_appointment_types = db.query(AppointmentType).count()

    return {
        "total_users": total_users,
        "total_organizers": total_organizers,
        "total_customers": total_customers,
        "total_bookings": total_bookings,
        "total_appointment_types": total_appointment_types,
    }



# =========================
# ADMIN – ALL BOOKINGS (SYSTEM WIDE)
# =========================
@router.get("/bookings", response_model=list[BookingResponse])
def get_admin_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    appointments = (
        db.query(Appointment)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    result = []
    for apt in appointments:
        slot = db.query(Slot).filter(Slot.id == apt.slot_id).first()
        apt_type = db.query(AppointmentType).filter(
            AppointmentType.id == apt.appointment_type_id
        ).first()
        user = db.query(User).filter(User.id == apt.user_id).first()

        result.append(
            BookingResponse(
                id=apt.id,
                appointment_type_id=apt.appointment_type_id,
                slot_id=apt.slot_id,
                user_id=apt.user_id,
                people_count=apt.people_count,
                status=apt.status,
                created_at=apt.created_at,
                appointment_type_name=apt_type.name if apt_type else "",
                slot_date=slot.slot_date.isoformat() if slot else "",
                start_time=slot.start_time.strftime("%H:%M") if slot else "",
                end_time=slot.end_time.strftime("%H:%M") if slot else "",
                booked_by=user.full_name if user else "",
            )
        )

    return result


# =========================
# ADMIN – USERS
# =========================
@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    users = db.query(User).all()

    response = []
    for user in users:
        roles = (
            db.query(Role.name)
            .join(UserRole)
            .filter(UserRole.user_id == user.id)
            .all()
        )

        response.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "roles": [r[0] for r in roles],
        })

    return response


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.get("is_active", user.is_active)
    db.commit()
    return {"message": "User status updated"}


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    new_role_name = payload.get("role")
    if not new_role_name:
        raise HTTPException(status_code=400, detail="Role is required")

    role = db.query(Role).filter(Role.name == new_role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Remove existing roles
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()

    # Assign new role
    db.add(UserRole(user_id=user_id, role_id=role.id))
    db.commit()

    return {"message": "User role updated"}

@router.get("/appointment-types")
def get_admin_appointment_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    appointment_types = (
        db.query(AppointmentType)
        .order_by(AppointmentType.created_at.desc())
        .all()
    )

    result = []

    for apt in appointment_types:
        organizer = (
            db.query(User)
            .filter(User.id == apt.created_by)
            .first()
        )

        result.append({
            "id": apt.id,
            "name": apt.name,
            "duration_minutes": apt.duration_minutes,
            "appointment_mode": apt.appointment_mode,
            "is_published": apt.is_published,
            "created_by_name": organizer.full_name if organizer else "—",
        })

    return result


    @router.get("/reports/revenue-by-appointment")
    def revenue_by_appointment(
        db: Session = Depends(get_db),
        current_user: User = Depends(require_roles("ADMIN")),
    ):
        data = (
            db.query(
                AppointmentType.name,
                func.count(Appointment.id).label("bookings"),
                func.sum(Payment.amount).label("revenue"),
            )
            .join(Appointment, Appointment.appointment_type_id == AppointmentType.id)
            .join(Payment, Payment.appointment_id == Appointment.id)
            .filter(Payment.status == "SUCCESS")
            .group_by(AppointmentType.name)
            .order_by(func.sum(Payment.amount).desc())
            .all()
        )

        return [
            {
                "appointment": name,
                "bookings": bookings,
                "revenue": float(revenue),
            }
            for name, bookings, revenue in data
        ]
@router.get("/reports/revenue-by-provider")
def revenue_by_provider(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    data = (
        db.query(
            User.full_name,
            func.count(Appointment.id),
            func.sum(Payment.amount),
        )
        .join(AppointmentType, AppointmentType.created_by == User.id)
        .join(Appointment, Appointment.appointment_type_id == AppointmentType.id)
        .join(Payment, Payment.appointment_id == Appointment.id)
        .filter(Payment.status == "SUCCESS")
        .group_by(User.full_name)
        .order_by(func.sum(Payment.amount).desc())
        .all()
    )

    return [
        {
            "provider": name,
            "bookings": bookings,
            "revenue": float(revenue),
        }
        for name, bookings, revenue in data
    ]

@router.get("/reports/recent-transactions")
def recent_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    payments = (
        db.query(Payment)
        .order_by(Payment.created_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": p.id,
            "amount": float(p.amount),
            "status": p.status,
            "created_at": p.created_at.isoformat(),
            "user": p.user.full_name,
            "service": p.appointment.appointment_type.name,
        }
        for p in payments
    ]
