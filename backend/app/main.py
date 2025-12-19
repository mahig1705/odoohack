from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
from app.routers import auth

app = FastAPI(title="Hackathon Backend")

# ✅ CORS (THIS FIXES THE ISSUE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DB check on startup
@app.on_event("startup")
def check_database_connection():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Database connected successfully")

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Routes
app.include_router(auth.router)
