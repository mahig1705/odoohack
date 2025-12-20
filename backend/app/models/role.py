from sqlalchemy import Column, String, SmallInteger
from app.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(SmallInteger, primary_key=True)
    name = Column(String(50), unique=True)
