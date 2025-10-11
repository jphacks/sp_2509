import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./test.db")

# The connect_args are only for SQLite.
engine_args = {"connect_args": {"check_same_thread": False}} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# FastAPIのDependsで利用するDBセッション取得用の関数
#
# FastAPIのエンドポイントで以下のように利用することで、DBセッションを取得できます。
#
# from fastapi import Depends
# from sqlalchemy.orm import Session
# from .database import get_db
#
# @app.get("/items/")
# def read_items(db: Session = Depends(get_db)):
#     # ここでdbセッションを利用してDB操作を行う
#     ...
#
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
