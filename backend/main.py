from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import uuid
from fastapi import Response, status
from typing import Optional
from .database import engine, get_db
from . import models, schemas
from .utils import calculate_distance_km
from geopy.distance import geodesic
from typing import Optional

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
# Routes: Calculate API (dummy)
# ------------------------------------------------------------
@app.post("/routes/calculate", response_model=schemas.RouteCalculateResponse)
def calculate_route(payload: schemas.RouteCalculateRequest):
    """
    図形のディスプレイ座標、開始位置、目標距離(km)を受け取り、
    ダミーの経路計算結果を返す。

    現状は固定値のダミーデータを返すのみ。
    """

    # ダミー応答データ（指定フォーマットに合わせる）
    return schemas.RouteCalculateResponse(
        total_distance_km=10.5,
        route_points=[
            schemas.LatLng(lat=12.123, lng=139.456),
            schemas.LatLng(lat=34.133, lng=139.466),
            schemas.LatLng(lat=56.143, lng=139.456),
        ],
        drawing_points=[
            schemas.LatLng(lat=98.125, lng=139.458),
            schemas.LatLng(lat=76.135, lng=139.468),
            schemas.LatLng(lat=54.145, lng=139.458),
        ],
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
            distance_to_start_km = calculate_distance_km(current_lat,current_lng,start_point.get("lat"),start_point.get("lng"))
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
        distance_to_start_km = calculate_distance_km(current_lat,current_lng,start_point.get("lat"),start_point.get("lng"))

    return schemas.CourseSummary(
        id=course_uuid,
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
):
    """
    完全ダミー:
    - DBへは保存しない
    - UUID形式の検証もしない
    - 201 Created を返し、Location ヘッダーで擬似IDを通知
    - レスポンスボディはなし
    """
    fake_course_id = str(uuid.uuid4())
    return Response(
        status_code=status.HTTP_201_CREATED,
        headers={"Location": f"/users/{user_id}/courses/{fake_course_id}"}
    )

@app.delete("/users/{user_id}/courses/{course_id}", status_code=204)
def delete_user_course(
    user_id: str,
    course_id: str,
):
    """
    完全ダミー: 実際には削除せず、常に 204 No Content を返す。
    """
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/users/{user_id}/courses/{course_id}/toggle_favorite", response_model=schemas.ToggleFavoriteResponse)
def toggle_course_favorite(
    user_id: str,
    course_id: str,
):
    """
    完全ダミー:
    - DBへは保存しない
    - UUID形式の検証はしない（非UUIDは UUIDv5 で正規化）
    - 擬似的に現在値を推定して反転した is_favorite を返す
    """
    cid="cb657453-7ccf-41c6-a496-121b1a1469e8"

    toggled = True

    return schemas.ToggleFavoriteResponse(id=cid, is_favorite=toggled)
