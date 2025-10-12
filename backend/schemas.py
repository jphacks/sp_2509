from pydantic import BaseModel
from datetime import datetime
class UserResponse(BaseModel):
    user_id: str

class UserDetail(BaseModel):
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# Routes: Calculate API Schemas
# ------------------------------------------------------------
class DisplayPoint(BaseModel):
    x: float
    y: float


class LatLng(BaseModel):
    lat: float
    lng: float


class RouteCalculateRequest(BaseModel):
    drawing_display_points: list[DisplayPoint]
    start_location: LatLng
    target_distance_km: float


class RouteCalculateResponse(BaseModel):
    total_distance_km: float
    route_points: list[LatLng]
    drawing_points: list[LatLng]