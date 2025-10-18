from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import uuid
from fastapi import Response, status
from typing import Optional
from .database import engine, get_db
from . import models, schemas
from geopy.distance import geodesic
from .calculator.gps_art_generator import GPSArtGenerator

def calculate_distance_km(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float]
) -> Optional[float]:
    """
    2点間の緯度経度から距離(km)を計算する。
    いずれかの座標が存在しない場合はNoneを返す。
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    
    return geodesic((lat1, lon1), (lat2, lon2)).km

# DBテーブルの作成
models.Base.metadata.create_all(bind=engine)

# GPSArtGeneratorのインスタンスを生成
art_generator = GPSArtGenerator(cache_enabled=True)

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/message")
def read_message():
    jst = timezone(timedelta(hours=+9), 'JST')
    now = datetime.now(jst).strftime('%Y-%m-%d %H:%M:%S')
    return {"message": f"Hello, World!  {now}"}

@app.post("/users", response_model=schemas.UserResponse, status_code=201)
def create_user(db: Session = Depends(get_db)):
    """
    新しいユーザーを作成し、UUIDを返す
    """
    # 新しいUUIDを生成
    new_user_id = uuid.uuid4()
    
    # ユーザーをDBに作成
    new_user = models.User(id=new_user_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return schemas.UserResponse(user_id=str(new_user.id))

@app.get("/users", response_model=list[schemas.UserDetail])
def get_all_users(db: Session = Depends(get_db)):
    """
    全ユーザーを取得（テスト用、いずれ削除予定）
    """
    users = db.query(models.User).all()
    return [
        schemas.UserDetail(
            user_id=str(user.id),
            created_at=user.created_at
        )
        for user in users
    ]


# ------------------------------------------------------------
# Routes: Calculate API
# ------------------------------------------------------------
@app.post("/routes/calculate", response_model=schemas.RouteCalculateResponse)
def calculate_route(payload: schemas.RouteCalculateRequest):
    """
    手書きの描画データ、開始地点、目標距離から最適なGPSアートコースを生成。

    このエンドポイントは、ユーザーが手書きした図形の座標、コースの開始地点（緯度経度）、
    そして目標とするコースの総距離（km）を入力として受け取る。

    Args:
        payload (schemas.RouteCalculateRequest): APIリクエストボディ。
            - `drawing_display_points`: 手書き図形のディスプレイ座標リスト (`[{x, y}, ...]`)
            - `start_location`: 開始地点の緯度経度 (`{lat, lng}`)
            - `target_distance_km`: 目標距離 (km)

    Returns:
        schemas.RouteCalculateResponse: 計算結果。
            - `total_distance_km`: 実際に生成されたルートの総距離 (km)
            - `route_points`: ルートを構成する緯度経度のリスト (`[{lat, lng}, ...]`)
            - `drawing_points`: 手書き経路の緯度経度のリスト
    """
    drawing_display_points = [point.dict() for point in payload.drawing_display_points]
    
    result = art_generator.calculate_route(
        drawing_display_points=drawing_display_points,
        start_location=payload.start_location.dict(),
        target_distance_km=payload.target_distance_km
    )

    return schemas.RouteCalculateResponse(
        total_distance_km=result["total_distance_km"],
        route_points=[schemas.LatLng(**point) for point in result["route_points"]],
        drawing_points=[schemas.LatLng(**point) for point in result["drawing_points"]],
    )

@app.get("/users/{user_id}/courses", response_model=list[schemas.CourseSummary])
def list_user_courses(
    user_id: str,
    db: Session = Depends(get_db),
    current_lat: Optional[float] = None,
    current_lng: Optional[float] = None,
    sort_by: str = "distance",
):
    """
    指定ユーザーが保存したコース一覧を返す。
    drawing_points は一覧では返さないため null を返却。
    ソート: created_at(新しい順) | distance(近い順) 
    """

    if sort_by not in ("created_at", "distance"):
        raise HTTPException(status_code=400, detail="sort_by must be 'created_at' or 'distance'")
    
    courses = db.query(models.Course).filter(models.Course.user_id == user_id).all()
    response_courses = []
    for course in courses:
        distance_to_start_km = 0.0
        if current_lat is not None and current_lng is not None and course.route_points:
            start_point = course.route_points[0]
            distance_to_start_km = calculate_distance_km(current_lat, current_lng, start_point.get("lat"), start_point.get("lng"))
        response_courses.append(
            schemas.CourseSummary(
                id=course.id,
                total_distance_km=course.total_distance_km,
                distance_to_start_km=distance_to_start_km,
                is_favorite=course.is_favorite,
                created_at=course.created_at,
                route_points=course.route_points,
                drawing_points=None,
            ) 
        )


    if sort_by == "created_at":
        response_courses.sort(key=lambda x: x.created_at, reverse=True)
    else:
        response_courses.sort(key=lambda x: x.distance_to_start_km)

    return response_courses

@app.get("/users/{user_id}/courses/{course_id}", response_model=schemas.CourseSummary)
def get_user_course(
    user_id: str,
    course_id: str,
    db: Session = Depends(get_db),
    current_lat: Optional[float] = None,
    current_lng: Optional[float] = None,
):
    """
    特定のコース1件の詳細を返す。
    """
    course = db.query(models.Course).filter(models.Course.user_id == user_id, models.Course.id == course_id).first()


    # course_id の形式チェック（UUIDでない場合は 400）
    try:
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format. Must be UUID.")

    jst = timezone(timedelta(hours=+9), 'JST')
    distance_to_start_km = 0.0
    if current_lat is not None and current_lng is not None and course.route_points:
        start_point = course.route_points[0]
        distance_to_start_km = calculate_distance_km(current_lat, current_lng, start_point.get("lat"), start_point.get("lng"))
       
    return schemas.CourseSummary(
        id=course.id,
        total_distance_km=course.total_distance_km,
        distance_to_start_km=distance_to_start_km,
        is_favorite=course.is_favorite,
        created_at=course.created_at,
        route_points=course.route_points,
        drawing_points=course.drawing_points,
    )

@app.post("/users/{user_id}/courses", status_code=201)
def create_course_for_user(
    user_id: str,
    payload: schemas.CourseCreateRequest,
    db: Session = Depends(get_db),
):
    """
    コースをDBに保存し、201 Created を返す。
    - user_id は UUID 形式を検証
    - ユーザーが存在しない場合は 404
    - 保存後、Location ヘッダーに作成したコースIDを設定
    - レスポンスボディはなし
    """
    # UUID形式チェック
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format. Must be UUID.")

    # ユーザー存在確認
    user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # ポイントをJSONへ整形
    def to_point_dict(p) -> dict:
        return {"lat": float(p.lat), "lng": float(p.lng)}

    route_points = [to_point_dict(p) for p in payload.route_points]
    dp = getattr(payload, "drawing_points", None)
    drawing_points = [to_point_dict(p) for p in dp] if dp is not None else []

    is_favorite = bool(getattr(payload, "is_favorite", False))

    # コース保存
    new_course = models.Course(
        user_id=user_uuid,
        total_distance_km=float(payload.total_distance_km),
        is_favorite=is_favorite,
        route_points=route_points,
        drawing_points=drawing_points,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return Response(
        status_code=status.HTTP_201_CREATED,
        headers={"Location": f"/users/{user_id}/courses/{str(new_course.id)}"}
    )

@app.delete("/users/{user_id}/courses/{course_id}", status_code=204)
def delete_user_course(
    user_id: str,
    course_id: str,
    db: Session = Depends(get_db),
):
    """
    指定ユーザーのコースを削除し、204 No Content を返す。
    - user_id, course_id は UUID 形式を検証（不正なら 400）
    - コースが存在しない、またはユーザーのものではない場合は 404
    """
    # UUID 形式チェック
    try:
        user_uuid = uuid.UUID(user_id)
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format. Must be UUID.")

    # コース存在＆所有者確認
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_uuid,
            models.Course.user_id == user_uuid,
        )
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # 削除
    db.delete(course)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/users/{user_id}/courses/{course_id}/toggle_favorite", response_model=schemas.ToggleFavoriteResponse)
def toggle_course_favorite(
    user_id: str,
    course_id: str,
    db: Session = Depends(get_db),
):
    """
    指定ユーザーのコースのお気に入りフラグをトグルして返す。
    - user_id, course_id は UUID 形式を検証（不正なら 400）
    - コースが存在しない、またはユーザーのものではない場合は 404
    """
    # UUID検証
    try:
        user_uuid = uuid.UUID(user_id)
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format. Must be UUID.")

    # コース存在＆所有者確認
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_uuid,
            models.Course.user_id == user_uuid,
        )
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # トグルして保存
    course.is_favorite = not bool(course.is_favorite)
    db.commit()
    db.refresh(course)

    return schemas.ToggleFavoriteResponse(id=str(course.id), is_favorite=course.is_favorite)
