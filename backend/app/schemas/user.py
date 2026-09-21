from pydantic import BaseModel, EmailStr
from typing import List, Optional
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


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True




