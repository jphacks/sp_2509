from pydantic import BaseModel
from typing import Optional
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


class NoticeRequest(BaseModel):
    start_location: LatLng
    target_distance_km: float

class CourseSummary(BaseModel):
    id: str
    total_distance_km: float
    distance_to_start_km: float
    is_favorite: bool
    created_at: datetime
    route_points: list[LatLng]
    # 一覧では返さないため null 固定
    drawing_points: Optional[list[LatLng]] = None

class CourseCreateRequest(BaseModel):
    total_distance_km: float
    route_points: list[LatLng]
    drawing_points: list[LatLng]

    # 1件の「お気に入り状態」だけ返すシンプルなレスポンス
class ToggleFavoriteResponse(BaseModel):
    id: str
    is_favorite: bool
