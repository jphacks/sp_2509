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
