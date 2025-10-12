from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import uuid
from typing import Optional
from .database import engine, get_db
from . import models, schemas

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
    current_lat: Optional[float] = None,
    current_lng: Optional[float] = None,
    sort_by: str = "created_at",
):
    """
    指定ユーザーが保存したコース一覧（ダミー）を返す。
    drawing_points は一覧では返さないため null を返却。
    ソート: created_at(新しい順) | distance(近い順) ※距離はダミー値を使用。
    """
    jst = timezone(timedelta(hours=+9), 'JST')
    created = datetime(2025, 10, 26, 10, 0, 0, tzinfo=jst)

    items = [
        schemas.CourseSummary(
            id=uuid.UUID("f81d4fae-7dec-11d0-a765-00a0c91e6bf6"),
            total_distance_km=10.5,
            distance_to_start_km=1.2,
            is_favorite=True,
            created_at=created,
            route_points=[
                schemas.LatLng(lat=35.123, lng=139.456),
                schemas.LatLng(lat=35.133, lng=139.466),
                schemas.LatLng(lat=35.143, lng=139.456),
            ],
            drawing_points=None,
        ),
        schemas.CourseSummary(
            id=uuid.UUID("cb657453-7ccf-41c6-a496-121b1a1469e8"),
            total_distance_km=10.5,
            distance_to_start_km=1.2,
            is_favorite=True,
            created_at=created,
            route_points=[
                schemas.LatLng(lat=35.123, lng=139.456),
                schemas.LatLng(lat=35.133, lng=139.466),
                schemas.LatLng(lat=35.143, lng=139.456),
            ],
            drawing_points=None,
        ),
    ]

    if sort_by not in ("created_at", "distance"):
        raise HTTPException(status_code=400, detail="sort_by must be 'created_at' or 'distance'")

    if sort_by == "created_at":
        items.sort(key=lambda x: x.created_at, reverse=True)
    else:
        items.sort(key=lambda x: x.distance_to_start_km)

    return items
