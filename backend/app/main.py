from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import (
    auth,
    appointment_type,
    working_hours,
    slot,
    booking,
    payment,
    cancel,
    appointment_answer,
    appointment_question,
    appointment_status,
    resource,
    user,
)
from app.models.role import Role
from app.models.user_role import UserRole

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Appointment Booking System")

# ✅ CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js
        "http://localhost:8080",
        "http://localhost:8081",  # Your request
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(appointment_type.router)
app.include_router(working_hours.router)
app.include_router(slot.router)
app.include_router(resource.router)
app.include_router(booking.router)
app.include_router(payment.router)
app.include_router(cancel.router)
app.include_router(appointment_question.router)
app.include_router(appointment_answer.router)
app.include_router(appointment_status.router)
