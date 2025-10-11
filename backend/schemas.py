from pydantic import BaseModel
from datetime import datetime
import uuid

class UserResponse(BaseModel):
    user_id: str

class UserDetail(BaseModel):
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True