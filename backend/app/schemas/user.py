from pydantic import BaseModel, EmailStr
from typing import List
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    is_active: bool
    is_verified: bool
    roles: List[str] = []

    class Config:
        from_attributes = True


