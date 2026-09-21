from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from typing import Any, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.agents.scheduling.tools import (
    cancel_existing_appointment,
    create_booking_record,
    create_payment_order,
    find_appointment_by_user,
    find_slots_for_request,
    lookup_appointment_type_for_request,
    lookup_existing_appointments,
    reschedule_appointment,
    verify_payment_order,
)

logger = logging.getLogger(__name__)

_DB_BY_THREAD: dict[str, Any] = {}


def _resolve_db(state: SchedulingAgentState, fallback_db: Any = None):
    thread_id = state.get("thread_id") or "schedularo-thread"
    db = _DB_BY_THREAD.get(thread_id, fallback_db)
    if db is None:
        context = state.get("context") or {}
        db = context.get("db")
    return db


class SchedulingAgentState(TypedDict, total=False):
    user_id: str | None
    thread_id: str | None
    conversation: list[dict[str, Any]]
    request_text: str
    intent: str
    context: dict[str, Any]
    service_name: str | None
    appointment_type: str | None
    appointment_type_id: str | None
    organizer_id: str | None
    provider_id: str | None
    resource_id: str | None
    requested_date: str | None
    date_range: str | None
    requested_time: str | None
    time_window: str | None
    duration_minutes: int | None
    location: str | None
    flexibility: str
    extracted_preferences: dict[str, Any]
    available_slots: list[dict[str, Any]]
    recommended_slots: list[dict[str, Any]]
    alternative_slots: list[dict[str, Any]]
    selected_slot: dict[str, Any] | None
    selected_slot_id: str | None
    confirmation_required: bool
    user_confirmation: bool
    booking_id: str | None
    payment_required: bool
    payment_status: str | None
    payment_order_id: str | None
    notification_status: str | None
    errors: list[str]
    error: str | None
    clarification_question: str | None
    status: str
    current_step: str
    payment_verification: bool
    appointment_id: str | None
    cancellation_target: str | None
    is_availability_query: bool


def build_initial_state(request_text: str, user_id: str | None = None, context: dict | None = None, thread_id: str | None = None):
    state: SchedulingAgentState = {
        "user_id": user_id,
        "thread_id": thread_id,
        "conversation": [],
        "request_text": request_text or "",
        "intent": "unknown",
        "context": context or {},
        "service_name": None,
        "appointment_type": None,
        "appointment_type_id": None,
        "organizer_id": None,
        "provider_id": None,
        "resource_id": None,
        "requested_date": None,
        "date_range": None,
        "requested_time": None,
        "time_window": None,
        "duration_minutes": None,
        "location": None,
        "flexibility": "exact",
        "extracted_preferences": {},
        "available_slots": [],
        "recommended_slots": [],
        "alternative_slots": [],
        "selected_slot": None,
        "selected_slot_id": None,
        "confirmation_required": False,
        "user_confirmation": False,
        "booking_id": None,
        "payment_required": False,
        "payment_status": None,
        "payment_order_id": None,
        "notification_status": None,
        "errors": [],
        "error": None,
        "clarification_question": None,
        "status": "new",
        "current_step": "start",
        "payment_verification": False,
        "appointment_id": None,
        "cancellation_target": None,
        "is_availability_query": False,
    }
    if context:
        state["appointment_type_id"] = context.get("appointment_type_id")
        state["organizer_id"] = context.get("organizer_id")
        state["resource_id"] = context.get("resource_id")
        state["service_name"] = context.get("appointment_type_name") or state.get("service_name")
        state["requested_date"] = context.get("preferred_date") or state.get("requested_date")
        state["requested_time"] = context.get("preferred_time") or state.get("requested_time")
        state["payment_required"] = bool(context.get("payment_required"))
        state["selected_slot_id"] = context.get("selected_slot_id")
        state["payment_verification"] = bool(context.get("payment_verification"))
        state["duration_minutes"] = context.get("duration_minutes") or state.get("duration_minutes")
        state["appointment_id"] = context.get("appointment_id")
        state["user_confirmation"] = bool(context.get("confirmed"))
    return state


def parse_natural_language_request(request_text: str, context: dict | None = None):
    text = (request_text or "").strip()
    if not text:
        return {
            "intent": "unknown",
            "service_name": None,
            "requested_date": None,
            "date_range": None,
            "requested_time": None,
            "time_window": None,
            "duration_minutes": None,
            "flexibility": "exact",
            "extracted_preferences": {},
        }

    lowered = text.lower()
    context = context or {}

    intent = "booking"
    if any(keyword in lowered for keyword in ["available", "open", "slots", "when", "free", "what time"]):
        intent = "availability"
    if any(keyword in lowered for keyword in ["cancel", "reschedule", "move", "change", "postpone"]):
        intent = "reschedule" if "reschedule" in lowered or "move" in lowered or "change" in lowered else "cancellation"

    service_name = context.get("appointment_type_name")
    if not service_name:
        for candidate in ["haircut", "consultation", "massage", "dentist", "therapy", "meeting", "checkup"]:
            if candidate in lowered:
                service_name = candidate.title()
                break

    requested_date = context.get("preferred_date")
    date_range = context.get("date_range")
    if "tomorrow" in lowered:
        requested_date = (datetime.utcnow().date() + timedelta(days=1)).isoformat()
    elif "today" in lowered:
        requested_date = datetime.utcnow().date().isoformat()
    elif "weekend" in lowered:
        date_range = "weekend"
    elif "next monday" in lowered:
        date_range = "next_monday"
    else:
        match = re.search(r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text)
        if match:
            requested_date = match.group(1)

    requested_time = context.get("preferred_time")
    time_window = context.get("preferred_time_range")
    time_match = re.search(r"(?:at|after|before|around|by)?\s*(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?", lowered)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2) or 0)
        suffix = (time_match.group(3) or "").lower()
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        requested_time = f"{hour:02d}:{minute:02d}:00"
    elif "evening" in lowered:
        time_window = "evening"
    elif "morning" in lowered:
        time_window = "morning"
    elif "afternoon" in lowered:
        time_window = "afternoon"

    flexibility = "exact"
    if any(keyword in lowered for keyword in ["nearest", "closest", "around", "after", "before", "if", "flexible"]):
        flexibility = "flexible"

    parsed = {
        "intent": intent,
        "service_name": service_name,
        "requested_date": requested_date,
        "date_range": date_range,
        "requested_time": requested_time,
        "time_window": time_window,
        "duration_minutes": context.get("duration_minutes") or 60,
        "flexibility": flexibility,
        "extracted_preferences": {
            "preferred_time_window": time_window,
            "approximate": flexibility == "flexible",
            "date_range": date_range,
        },
    }
    return parsed


def parse_booking_request(state: SchedulingAgentState) -> SchedulingAgentState:
    parsed = parse_natural_language_request(state.get("request_text", ""), state.get("context", {}))
    state["intent"] = parsed.get("intent") or state.get("intent", "unknown")
    state["service_name"] = parsed.get("service_name") or state.get("service_name")
    state["requested_date"] = parsed.get("requested_date") or state.get("requested_date")
    state["date_range"] = parsed.get("date_range") or state.get("date_range")
    state["requested_time"] = parsed.get("requested_time") or state.get("requested_time")
    state["time_window"] = parsed.get("time_window") or state.get("time_window")
    state["duration_minutes"] = parsed.get("duration_minutes") or state.get("duration_minutes") or 60
    state["flexibility"] = parsed.get("flexibility") or state.get("flexibility", "exact")
    state["extracted_preferences"] = parsed.get("extracted_preferences") or state.get("extracted_preferences", {})
    state["current_step"] = "parse_request"
    return state


def validate_booking_request(state: SchedulingAgentState) -> SchedulingAgentState:
    if not state.get("user_id"):
        state["status"] = "error"
        state["error"] = "A valid user is required to book an appointment."
        state["current_step"] = "validate_request"
        return state

    if state.get("intent") in {"availability"}:
        state["status"] = "ready_for_availability"
        state["current_step"] = "validate_request"
        return state

    if not state.get("service_name") and not state.get("appointment_type_id"):
        state["status"] = "needs_clarification"
        state["clarification_question"] = "Which service would you like to book?"
        state["current_step"] = "validate_request"
        return state

    if state.get("time_window") and not state.get("requested_time") and state.get("time_window") in {"evening", "morning", "afternoon"}:
        state["status"] = "needs_clarification"
        state["clarification_question"] = "Could you tell me the preferred time more specifically, such as 6 PM or after 6 PM?"
        state["current_step"] = "validate_request"
        return state

    state["status"] = "validated"
    state["current_step"] = "validate_request"
    return state


def route_by_intent(state: SchedulingAgentState):
    if state.get("status") in {"error", "needs_clarification"}:
        return "END"
    intent = state.get("intent") or "booking"
    if intent == "availability":
        return "check_availability"
    if intent == "cancellation":
        return "validate_cancellation"
    if intent == "reschedule":
        return "validate_reschedule"
    return "check_availability"


def handle_availability_lookup(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    appointment_type = lookup_appointment_type_for_request(db, state.get("service_name"), context)
    if appointment_type:
        state["service_name"] = appointment_type.get("name") or state.get("service_name")
        state["appointment_type_id"] = state.get("appointment_type_id") or appointment_type.get("id")

    if not state.get("appointment_type_id") and state.get("service_name"):
        state["status"] = "needs_clarification"
        state["clarification_question"] = "I could not locate that service. Please choose one of the available appointment types."
        state["current_step"] = "check_availability"
        return state

    slots = find_slots_for_request(
        db,
        appointment_type_id=state.get("appointment_type_id"),
        requested_date=state.get("requested_date"),
        requested_time=state.get("requested_time"),
        preferred_time_range=state.get("time_window"),
    )
    state["available_slots"] = slots
    state["recommended_slots"] = slots[:3]
    state["status"] = "availability_ready"
    state["current_step"] = "check_availability"
    return state


def evaluate_slot_recommendations(state: SchedulingAgentState) -> SchedulingAgentState:
    slots = state.get("available_slots") or []
    if not slots:
        state["status"] = "error"
        state["error"] = "No slots available for the requested date and time."
        state["current_step"] = "evaluate_availability"
        return state

    requested_time = (state.get("requested_time") or "").strip()
    selected_slot = None
    for slot in slots:
        if requested_time and slot.get("start_time", "").startswith(requested_time[:5]):
            selected_slot = slot
            break

    if selected_slot:
        state["selected_slot"] = selected_slot
        state["selected_slot_id"] = selected_slot.get("id")
        state["status"] = "ready_for_confirmation"
        state["confirmation_required"] = True
        state["clarification_question"] = (
            f"I found a slot for {selected_slot.get('slot_date')} at {selected_slot.get('start_time')}. "
            "Would you like me to confirm this booking?"
        )
        state["recommended_slots"] = [selected_slot]
        state["alternative_slots"] = []
        state["current_step"] = "evaluate_availability"
        return state

    alternatives = slots[:3]
    state["recommended_slots"] = alternatives
    state["alternative_slots"] = alternatives
    state["status"] = "needs_confirmation"
    state["confirmation_required"] = True
    state["clarification_question"] = (
        "The requested time is unavailable. I found: " + ", ".join(
            f"{slot.get('slot_date')} {slot.get('start_time')}" for slot in alternatives
        ) + ". Which one would you prefer?"
    )
    state["current_step"] = "evaluate_availability"
    return state


def validate_confirmation(state: SchedulingAgentState) -> SchedulingAgentState:
    if state.get("user_confirmation") or state.get("selected_slot_id"):
        state["status"] = "confirmed_selected"
        state["current_step"] = "validate_confirmation"
        return state
    if state.get("recommended_slots") or state.get("alternative_slots"):
        state["status"] = "needs_confirmation"
        state["current_step"] = "validate_confirmation"
        return state
    state["status"] = "waiting_for_confirmation"
    state["current_step"] = "validate_confirmation"
    return state


def create_booking_node(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    slot_id = state.get("selected_slot_id")
    if not slot_id and state.get("recommended_slots"):
        slot_id = state["recommended_slots"][0].get("id")
    if not slot_id:
        state["status"] = "needs_confirmation"
        state["clarification_question"] = "Please select a slot before booking."
        return state

    booking = create_booking_record(db, user_id=state.get("user_id"), slot_id=slot_id)
    state["booking_id"] = booking.get("appointment_id")
    state["status"] = "booking_created"
    state["current_step"] = "create_booking"
    return state


def initiate_payment(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    if not state.get("payment_required"):
        state["payment_status"] = "not_required"
        return state

    amount = float(context.get("amount") or 0)
    order = create_payment_order(db, appointment_id=state.get("booking_id"), amount=amount)
    state["payment_order_id"] = order.get("order_id")
    state["payment_status"] = order.get("status")
    state["status"] = "payment_pending"
    state["current_step"] = "initiate_payment"
    return state


def verify_payment(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    if not state.get("payment_verification"):
        state["payment_status"] = state.get("payment_status") or "not_required"
        state["status"] = "confirmed"
        return state

    verification = verify_payment_order(
        db,
        payment_id=context.get("payment_id"),
        razorpay_order_id=context.get("razorpay_order_id"),
        razorpay_payment_id=context.get("razorpay_payment_id"),
        razorpay_signature=context.get("razorpay_signature"),
    )
    if not verification.get("success"):
        state["status"] = "error"
        state["error"] = verification.get("error") or "Payment verification failed."
        return state

    state["status"] = "confirmed"
    state["payment_status"] = "SUCCESS"
    state["current_step"] = "verify_payment"
    return state


def validate_cancellation(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    appointment_id = state.get("appointment_id") or context.get("appointment_id")
    if not appointment_id:
        state["status"] = "needs_clarification"
        state["clarification_question"] = "Which appointment would you like to cancel?"
        return state

    appointment = find_appointment_by_user(db, user_id=state.get("user_id"), appointment_id=appointment_id)
    if not appointment:
        state["status"] = "error"
        state["error"] = "Appointment not found for this user."
        return state

    state["appointment_id"] = str(appointment["id"])
    state["status"] = "ready_for_cancellation_confirmation"
    state["confirmation_required"] = True
    state["clarification_question"] = "I can cancel this appointment. Please confirm."
    state["current_step"] = "validate_cancellation"
    return state


def validate_reschedule(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    appointment_id = state.get("appointment_id") or context.get("appointment_id")
    appointment = find_appointment_by_user(db, user_id=state.get("user_id"), appointment_id=appointment_id) if appointment_id else None
    if not appointment:
        state["status"] = "needs_clarification"
        state["clarification_question"] = "I could not find the appointment to reschedule. Please provide the appointment or date."
        return state

    state["appointment_id"] = str(appointment["id"])
    state["status"] = "ready_for_reschedule"
    state["confirmation_required"] = True
    state["current_step"] = "validate_reschedule"
    return state


def process_cancellation(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    if not state.get("user_confirmation"):
        state["status"] = "waiting_for_confirmation"
        return state
    if not state.get("appointment_id"):
        state["status"] = "error"
        state["error"] = "No appointment selected for cancellation."
        return state
    cancel_existing_appointment(db, user_id=state.get("user_id"), appointment_id=state.get("appointment_id"))
    state["status"] = "cancelled"
    state["current_step"] = "process_cancellation"
    return state


def process_reschedule(state: SchedulingAgentState, db=None) -> SchedulingAgentState:
    context = state.get("context") or {}
    db = _resolve_db(state, db)
    if not state.get("user_confirmation"):
        state["status"] = "waiting_for_confirmation"
        return state
    if not state.get("appointment_id") or not state.get("selected_slot_id"):
        state["status"] = "needs_clarification"
        state["clarification_question"] = "Please choose a new slot before rescheduling."
        return state
    reschedule_appointment(db, user_id=state.get("user_id"), appointment_id=state.get("appointment_id"), slot_id=state.get("selected_slot_id"))
    state["status"] = "rescheduled"
    state["current_step"] = "process_reschedule"
    return state


def booking_confirmation(state: SchedulingAgentState) -> SchedulingAgentState:
    if state.get("status") == "error":
        return state
    state["confirmation_required"] = False
    state["status"] = "confirmed"
    state["current_step"] = "booking_confirmation"
    state["error"] = None
    return state


def route_after_confirmation(state: SchedulingAgentState):
    if state.get("status") in {"waiting_for_confirmation", "needs_clarification", "needs_confirmation", "ready_for_confirmation", "error"}:
        return "END"
    if state.get("intent") == "cancellation":
        return "process_cancellation"
    if state.get("intent") == "reschedule":
        return "process_reschedule"
    return "create_booking"


def build_graph():
    graph = StateGraph(SchedulingAgentState)
    graph.add_node("parse_request", parse_booking_request)
    graph.add_node("validate_request", validate_booking_request)
    graph.add_node("check_availability", handle_availability_lookup)
    graph.add_node("evaluate_availability", evaluate_slot_recommendations)
    graph.add_node("validate_confirmation", validate_confirmation)
    graph.add_node("create_booking", create_booking_node)
    graph.add_node("initiate_payment", initiate_payment)
    graph.add_node("verify_payment", verify_payment)
    graph.add_node("validate_cancellation", validate_cancellation)
    graph.add_node("validate_reschedule", validate_reschedule)
    graph.add_node("process_cancellation", process_cancellation)
    graph.add_node("process_reschedule", process_reschedule)
    graph.add_node("booking_confirmation", booking_confirmation)

    graph.add_edge(START, "parse_request")
    graph.add_edge("parse_request", "validate_request")
    graph.add_conditional_edges("validate_request", route_by_intent, {
        "check_availability": "check_availability",
        "validate_cancellation": "validate_cancellation",
        "validate_reschedule": "validate_reschedule",
        "END": END,
    })
    graph.add_edge("check_availability", "evaluate_availability")
    graph.add_conditional_edges("evaluate_availability", lambda state: "validate_confirmation" if state.get("status") in {"ready_for_confirmation", "needs_confirmation"} else "END", {
        "validate_confirmation": "validate_confirmation",
        "END": END,
    })
    graph.add_conditional_edges("validate_confirmation", route_after_confirmation, {
        "process_cancellation": "process_cancellation",
        "process_reschedule": "process_reschedule",
        "create_booking": "create_booking",
        "END": END,
    })
    graph.add_edge("create_booking", "initiate_payment")
    graph.add_edge("initiate_payment", "verify_payment")
    graph.add_edge("verify_payment", "booking_confirmation")
    graph.add_edge("validate_cancellation", "process_cancellation")
    graph.add_edge("validate_reschedule", "process_reschedule")
    graph.add_edge("process_cancellation", END)
    graph.add_edge("process_reschedule", END)
    graph.add_edge("booking_confirmation", END)

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)


def run_booking_workflow(state: SchedulingAgentState, db=None, thread_id: str | None = None):
    """Run the scheduling workflow with a memory-backed state graph and deterministic service calls."""
    state = {**state}
    state["thread_id"] = thread_id or state.get("thread_id") or "schedularo-thread"
    if not state.get("user_id"):
        state["status"] = "error"
        state["error"] = "A valid user is required to book an appointment."
        return state

    thread_key = state["thread_id"]
    _DB_BY_THREAD[thread_key] = db
    try:
        graph = build_graph()
        config = {"configurable": {"thread_id": thread_key}}
        result = graph.invoke(state, config=config)
    finally:
        _DB_BY_THREAD.pop(thread_key, None)

    if result.get("status") == "booking_created":
        result["status"] = "confirmed"

    if result.get("errors") is None:
        result["errors"] = []
    return result
