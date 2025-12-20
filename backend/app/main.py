from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth,appointment_type,working_hours,slot,booking,payment,cancel
from app.routers import resource
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Appointment Booking System")

app.include_router(auth.router)
app.include_router(appointment_type.router)
app.include_router(working_hours.router)

app.include_router(slot.router)
app.include_router(resource.router)
app.include_router(booking.router)
app.include_router(payment.router)
app.include_router(cancel.router)