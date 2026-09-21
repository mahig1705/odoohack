from datetime import datetime, timedelta

from app.agents.scheduling.graph import build_graph
from app.database import SessionLocal
from app.models.user import User


if __name__ == "__main__":
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("NO_USER_FOUND")
            raise SystemExit(1)

        request_date = (datetime.utcnow().date() + timedelta(days=1)).isoformat()
        state = {
            "user_id": str(user.id),
            "request_text": "Book this appointment tomorrow at 10 AM",
            "context": {
                "appointment_type_id": "6763a7c1-d3a7-419d-9252-2d8673f8e5bc",
                "preferred_date": request_date,
                "preferred_time": "10:00:00",
                "amount": 0,
            },
            "thread_id": "verify-langgraph-slot-flow",
        }

        result = build_graph().invoke(state, config={"configurable": {"thread_id": state["thread_id"]}})
        print("STATUS", result.get("status"))
        print("BOOKING_ID", result.get("booking_id"))
        print("SELECTED_SLOT_ID", result.get("selected_slot_id"))
        print("AVAILABLE_SLOTS", len(result.get("available_slots") or []))
        print("ERROR", result.get("error"))
        print("CLARIFICATION", result.get("clarification_question"))
    finally:
        db.close()
