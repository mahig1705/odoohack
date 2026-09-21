from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ResourceCreate(BaseModel):
    name: str
    capacity: Optional[int] = 1
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ResourceResponse(BaseModel):
    id: UUID
    name: str
    capacity: int
    is_active: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
