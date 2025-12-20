from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth,appointment_type

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Appointment Booking System")

app.include_router(auth.router)
app.include_router(appointment_type.router)
