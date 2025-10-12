from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import uuid
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
