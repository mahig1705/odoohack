from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.scheduling.graph import build_initial_state, run_booking_workflow
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agent", tags=["AI Scheduling Agent"])


@router.post("/book")
def book_with_agent(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run the scheduling LangGraph workflow for a natural-language booking request."""
    message = (payload or {}).get("message")
    if not message or not str(message).strip():
        raise HTTPException(status_code=400, detail="A booking message is required")

    context = (payload or {}).get("context") or {}
    state = build_initial_state(str(message), user_id=str(current_user.id), context=context)
    result = run_booking_workflow(state, db=db)

    if result.get("status") in {"error", "needs_clarification"}:
        return {
            "status": result.get("status"),
            "message": result.get("error") or result.get("clarification_question") or "Unable to process booking request.",
            "interpreted_request": {
                "service_name": result.get("service_name"),
                "requested_date": result.get("requested_date"),
                "requested_time": result.get("requested_time"),
                "preferred_time_range": result.get("preferred_time_range"),
            },
            "clarification_question": result.get("clarification_question"),
            "available_slots": result.get("available_slots", []),
            "alternative_slots": result.get("alternative_slots", []),
            "booking_id": result.get("booking_id"),
            "payment_required": result.get("payment_required", False),
            "payment_order_id": result.get("payment_order_id"),
            "error": result.get("error"),
        }

    return {
        "status": result.get("status"),
        "message": result.get("confirmation_message") or result.get("clarification_question") or "Booking workflow completed.",
        "interpreted_request": {
            "service_name": result.get("service_name"),
            "requested_date": result.get("requested_date"),
            "requested_time": result.get("requested_time"),
            "preferred_time_range": result.get("preferred_time_range"),
        },
        "clarification_question": result.get("clarification_question"),
        "available_slots": result.get("available_slots", []),
        "alternative_slots": result.get("alternative_slots", []),
        "booking_id": result.get("booking_id"),
        "payment_required": result.get("payment_required", False),
        "payment_order_id": result.get("payment_order_id"),
        "payment_status": result.get("payment_status"),
        "error": result.get("error"),
    }
