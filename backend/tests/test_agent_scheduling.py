from datetime import date, time
from uuid import uuid4

import pytest

from app.agents.scheduling.graph import build_initial_state, run_booking_workflow


@pytest.fixture
def sample_user_id():
    return str(uuid4())


def test_resource_create_schema_accepts_coordinates():
    from app.schemas.resource import ResourceCreate

    resource = ResourceCreate(
        name="Downtown Clinic",
        capacity=2,
        latitude=28.6139,
        longitude=77.2090,
    )

    assert resource.latitude == 28.6139
    assert resource.longitude == 77.2090


def test_workflow_uses_db_session_in_live_graph(monkeypatch, sample_user_id):
    observed = {}

    def fake_lookup(db, service_name, context=None):
        observed["lookup_db"] = db
        return {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60}

    def fake_find_slots(db, **kwargs):
        observed["slots_db"] = db
        return [{
            "id": str(uuid4()),
            "appointment_type_id": str(uuid4()),
            "slot_date": "2026-09-22",
            "start_time": "18:00:00",
            "end_time": "19:00:00",
            "status": "OPEN",
            "booked_capacity": 0,
            "max_capacity": 1,
        }]

    def fake_create_booking(db, **kwargs):
        observed["booking_db"] = db
        return {"appointment_id": str(uuid4()), "status": "BOOKED"}

    monkeypatch.setattr("app.agents.scheduling.graph.lookup_appointment_type_for_request", fake_lookup)
    monkeypatch.setattr("app.agents.scheduling.graph.find_slots_for_request", fake_find_slots)
    monkeypatch.setattr("app.agents.scheduling.graph.create_booking_record", fake_create_booking)

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    db = object()
    result = run_booking_workflow(state, db=db)

    assert result["status"] == "confirmed"
    assert observed["lookup_db"] is db
    assert observed["slots_db"] is db
    assert observed["booking_db"] is db


def test_exact_slot_available(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [
            {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:00:00", "end_time": "19:00:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1}
        ],
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_booking_record",
        lambda *args, **kwargs: {"appointment_id": str(uuid4()), "status": "BOOKED"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "confirmed"
    assert result["booking_id"] is not None


def test_exact_slot_unavailable_returns_alternatives(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [
            {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:30:00", "end_time": "19:30:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1},
            {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "19:00:00", "end_time": "20:00:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1},
        ],
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "needs_confirmation"
    assert len(result["alternative_slots"]) >= 1
    assert result["clarification_question"]


def test_alternative_selection_creates_booking(monkeypatch, sample_user_id):
    alt_slot = {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:30:00", "end_time": "19:30:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1}
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [alt_slot],
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_booking_record",
        lambda *args, **kwargs: {"appointment_id": str(uuid4()), "status": "BOOKED"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow after 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut", "selected_slot_id": alt_slot["id"]},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] in {"confirmed", "needs_confirmation"}


def test_missing_information_requests_clarification(sample_user_id):
    state = build_initial_state(
        "Book me an appointment",
        user_id=sample_user_id,
        context={},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "needs_clarification"
    assert result["clarification_question"]


def test_ambiguous_time_requests_clarification(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    state = build_initial_state(
        "Book me a haircut tomorrow evening",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] in {"needs_clarification", "needs_confirmation"}


def test_no_slots_available_returns_error(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [],
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "error"
    assert "no slots" in result["error"].lower()


def test_payment_required_creates_payment_order(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    slot = {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:00:00", "end_time": "19:00:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1}
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [slot],
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_booking_record",
        lambda *args, **kwargs: {"appointment_id": str(uuid4()), "status": "BOOKED"},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_payment_order",
        lambda *args, **kwargs: {"payment_id": str(uuid4()), "order_id": "order_123", "status": "PENDING"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut", "payment_required": True, "amount": 250.00},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "confirmed"
    assert result["payment_required"] is True
    assert result["payment_order_id"] == "order_123"


def test_payment_verification_failure_is_returned(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    slot = {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:00:00", "end_time": "19:00:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1}
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [slot],
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_booking_record",
        lambda *args, **kwargs: {"appointment_id": str(uuid4()), "status": "BOOKED"},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_payment_order",
        lambda *args, **kwargs: {"payment_id": str(uuid4()), "order_id": "order_123", "status": "PENDING"},
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.verify_payment_order",
        lambda *args, **kwargs: {"success": False, "error": "Invalid signature"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut", "payment_required": True, "amount": 250.00, "payment_verification": True},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "error"
    assert "signature" in result["error"].lower()


def test_invalid_or_unauthorized_user_returns_error(sample_user_id):
    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=None,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] == "error"
    assert "user" in result["error"].lower()


def test_llm_malformed_output_is_handled_by_fallback(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.parse_natural_language_request",
        lambda *args, **kwargs: {"bad": "shape"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert result["status"] in {"needs_clarification", "error", "needs_confirmation"}


def test_agent_uses_existing_booking_service_contract(monkeypatch, sample_user_id):
    monkeypatch.setattr(
        "app.agents.scheduling.graph.lookup_appointment_type_for_request",
        lambda *args, **kwargs: {"id": str(uuid4()), "name": "Haircut", "duration_minutes": 60},
    )
    slot = {"id": str(uuid4()), "appointment_type_id": str(uuid4()), "slot_date": "2026-09-22", "start_time": "18:00:00", "end_time": "19:00:00", "status": "OPEN", "booked_capacity": 0, "max_capacity": 1}
    monkeypatch.setattr(
        "app.agents.scheduling.graph.find_slots_for_request",
        lambda *args, **kwargs: [slot],
    )
    monkeypatch.setattr(
        "app.agents.scheduling.graph.create_booking_record",
        lambda *args, **kwargs: {"appointment_id": str(uuid4()), "status": "BOOKED"},
    )

    state = build_initial_state(
        "Book me a haircut tomorrow at 6 PM",
        user_id=sample_user_id,
        context={"appointment_type_name": "Haircut"},
    )
    result = run_booking_workflow(state, db=None)

    assert "booking_id" in result
    assert result["status"] == "confirmed"
