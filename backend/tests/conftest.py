# backend/tests/conftest.py
import sys
import os
import pytest

# プロジェクトルートをsys.pathに追加
# conftest.pyが backend/tests/ にあるので、2階層上がる
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# backend パッケージ内のモジュールをインポート
# (pytest をプロジェクトルートから実行すれば 'backend.' で見つかるはず)
from backend.database import Base, get_db
from backend.main import app

# テスト用のインメモリSQLiteデータベースURL
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# テスト用エンジンを作成
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, # テスト用にStaticPoolを使用
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# テスト用のDBセッションを提供する関数
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# アプリケーションの依存関係をテスト用にオーバーライド
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    # テスト開始前にテーブルを作成
    Base.metadata.create_all(bind=engine)
    yield
    # テスト終了後にテーブルを削除 (必要に応じて)
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(create_test_database):
    """
    各テスト関数で利用するTestClientフィクスチャ
    """
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session(create_test_database):
    """
    各テスト関数で利用するDBセッションフィクスチャ
    テストごとにデータをクリアする (シンプルなロールバック)
    """
    # Create a new connection for each test
    connection = engine.connect()
    # Begin a transaction
    transaction = connection.begin()
    # Create a session bound to this connection
    session = TestingSessionLocal(bind=connection)

    # Yield the session to the test function
    yield session

    # Clean up after the test function completes
    session.close()
    # Rollback the transaction to discard changes
    transaction.rollback()
    # Close the connection
    connection.close()
