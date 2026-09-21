from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class BookingIntent(BaseModel):
    intent: Literal["booking", "availability", "cancellation", "reschedule", "unknown"] = "unknown"
    service_name: str | None = None
    appointment_type_id: str | None = None
    organizer_id: str | None = None
    provider_id: str | None = None
    resource_id: str | None = None
    requested_date: str | None = None
    date_range: str | None = None
    requested_time: str | None = None
    time_window: str | None = None
    duration_minutes: int | None = None
    location: str | None = None
    flexibility: Literal["exact", "flexible", "any"] = "exact"
    extracted_preferences: dict[str, Any] = Field(default_factory=dict)
    selected_slot_id: str | None = None
    appointment_id: str | None = None
    confirmed: bool = False

    @field_validator("requested_time", "time_window", mode="before")
    @classmethod
    def normalize_optional_strings(cls, value):
        if value is None:
            return None
        return str(value).strip() or None


class BookingAgentResponse(BaseModel):
    success: bool = False
    intent: str = "unknown"
    status: Literal["needs_clarification", "needs_confirmation", "confirmed", "error", "waiting"] = "waiting"
    message: str = ""
    interpreted_request: dict[str, Any] = Field(default_factory=dict)
    clarification_question: str | None = None
    available_slots: list[dict[str, Any]] = Field(default_factory=list)
    recommended_slots: list[dict[str, Any]] = Field(default_factory=list)
    selected_slot: dict[str, Any] | None = None
    booking: dict[str, Any] | None = None
    payment: dict[str, Any] | None = None
    booking_id: str | None = None
    payment_required: bool = False
    payment_order_id: str | None = None
    error: str | None = None
    requires_confirmation: bool = False
    thread_id: str | None = None


class SchedulingRequestInput(BaseModel):
    message: str
    thread_id: str | None = None
    confirmed: bool = False
    selected_slot_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)
