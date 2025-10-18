#本番では使わないでください（ダミーデータ）
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal, engine

def seed_data(db: Session):
    # 既存のデータをクリア
    db.query(models.Course).delete()
    db.query(models.User).delete()
    db.commit()

    # --- ユーザーデータ ---
    user1_id = uuid.uuid4()
    user2_id = uuid.uuid4()

    user1 = models.User(id=user1_id, created_at=datetime.now())
    user2 = models.User(id=user2_id, created_at=datetime.now())

    db.add_all([user1, user2])
    db.commit()
    print(f"作成したユーザーID 1: {user1_id}")
    print(f"作成したユーザーID 2: {user2_id}")

    # --- コースデータ ---
    # JSTタイムゾーンを定義
    jst = timezone(timedelta(hours=+9))

    # コース1: 皇居ランニングコース (約5km)
    course1 = models.Course(
        user_id=user1_id,
        total_distance_km=5.0,
        is_favorite=True,
        created_at=datetime(2023, 10, 1, 8, 0, 0, tzinfo=jst),
        route_points=[
            {"lat": 35.68517, "lng": 139.75279},  # 東京駅
            {"lat": 35.68815, "lng": 139.75279},
            {"lat": 35.69176, "lng": 139.75338},  # 竹橋
            {"lat": 35.69315, "lng": 139.74932},
            {"lat": 35.69089, "lng": 139.74411},
            {"lat": 35.68612, "lng": 139.74543},  # 半蔵門
            {"lat": 35.68136, "lng": 139.74872},
            {"lat": 35.67911, "lng": 139.75231},  # 桜田門
            {"lat": 35.68123, "lng": 139.75279},
            {"lat": 35.68517, "lng": 139.75279},  # 東京駅
        ],
        drawing_points=[
            {"lat": 35.68, "lng": 139.75},
            {"lat": 35.69, "lng": 139.75},
            {"lat": 35.69, "lng": 139.74},
            {"lat": 35.68, "lng": 139.74},
            {"lat": 35.68, "lng": 139.75},
        ]
    )

    # コース2: 渋谷・原宿・表参道 (約3km)
    course2 = models.Course(
        user_id=user1_id,
        total_distance_km=3.2,
        is_favorite=False,
        created_at=datetime(2023, 10, 15, 18, 30, 0, tzinfo=jst),
        route_points=[
            {"lat": 35.65803, "lng": 139.70164},  # 渋谷駅
            {"lat": 35.66336, "lng": 139.70123},
            {"lat": 35.66811, "lng": 139.70321},
            {"lat": 35.67017, "lng": 139.70276},  # 原宿駅
            {"lat": 35.66909, "lng": 139.70732},
            {"lat": 35.66562, "lng": 139.71216},  # 表参道駅
            {"lat": 35.66224, "lng": 139.70788},
            {"lat": 35.65803, "lng": 139.70164},  # 渋谷駅
        ],
        drawing_points=[
            {"lat": 35.65, "lng": 139.70},
            {"lat": 35.67, "lng": 139.70},
            {"lat": 35.66, "lng": 139.71},
            {"lat": 35.65, "lng": 139.70},
        ]
    )
    
    # コース3: 札幌・大通公園 (約2.5km)
    course3 = models.Course(
        user_id=user2_id,
        total_distance_km=2.5,
        created_at=datetime(2023, 9, 20, 12, 0, 0, tzinfo=jst),
        route_points=[
            {"lat": 43.06869, "lng": 141.35080}, # 札幌駅
            {"lat": 43.06403, "lng": 141.35339},
            {"lat": 43.06093, "lng": 141.35649},  # テレビ塔
            {"lat": 43.05929, "lng": 141.35032},
            {"lat": 43.05739, "lng": 141.34411},
            {"lat": 43.06011, "lng": 141.34212},
            {"lat": 43.06450, "lng": 141.34680},
            {"lat": 43.06869, "lng": 141.35080}, # 札幌駅
        ],
        drawing_points=[
            {"lat": 43.06, "lng": 141.35},
            {"lat": 43.05, "lng": 141.34}
        ]
    )

    db.add_all([course1, course2, course3])
    db.commit()
    db.close()

    print("データベースにダミーデータを投入しました。")


if __name__ == "__main__":
    # DBテーブルを作成
    models.Base.metadata.create_all(bind=engine)
    
    # DBセッションを作成
    db = SessionLocal()
    
    # データを投入
    seed_data(db)