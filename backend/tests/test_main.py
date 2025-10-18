# backend/tests/test_main.py
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import pytest
import uuid

# backend パッケージ内のモジュールをインポート
from backend import models
from backend import schemas

# conftest.py で定義した client, db_session フィクスチャを使用


def test_create_user(client: TestClient):
    # 新しいユーザー作成APIが201を返し、有効なUUIDを含むレスポンスを返すことを検証する
    # (POST /users がユーザーを作成し user_id を返すことを期待)
    response = client.post("/users")
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    # UUID形式であることを確認
    try:
        uuid.UUID(data["user_id"])
    except ValueError:
        pytest.fail("user_id is not a valid UUID")


# --- Course API Tests ---

def test_create_course_for_user(client: TestClient, db_session: Session):
    # 指定ユーザーに対してコース作成APIが201とLocationヘッダーを返し、DBに保存されていることを検証する
    # テスト用ユーザーを作成
    user = models.User()
    db_session.add(user)
    db_session.commit()
    user_id = str(user.id)

    course_data = {
        "total_distance_km": 7.5,
        "route_points": [{"lat": 35.1, "lng": 139.1}, {"lat": 35.2, "lng": 139.2}],
        "drawing_points": [{"lat": 35.15, "lng": 139.15}, {"lat": 35.25, "lng": 139.25}]
    }
    response = client.post(f"/users/{user_id}/courses", json=course_data)

    assert response.status_code == 201
    assert "location" in response.headers
    course_url = response.headers["location"]
    assert course_url.startswith(f"/users/{user_id}/courses/")

    # DBに保存されたか確認 (オプション)
    course_id = course_url.split("/")[-1]
    db_course = db_session.query(models.Course).filter(models.Course.id == course_id).first()
    assert db_course is not None
    assert db_course.user_id == user.id
    assert db_course.total_distance_km == 7.5
    assert len(db_course.route_points) == 2
    assert db_course.route_points[0]['lat'] == 35.1

def test_create_course_user_not_found(client: TestClient):
    # 存在しないユーザーIDでコース作成を試みると404が返ることを検証する
    non_existent_user_id = str(uuid.uuid4())
    course_data = {
        "total_distance_km": 5.0,
        "route_points": [],
        "drawing_points": []
    }
    response = client.post(f"/users/{non_existent_user_id}/courses", json=course_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."

def test_list_user_courses_empty(client: TestClient, db_session: Session):
    # ユーザーにコースがない場合、/users/{user_id}/courses が空リストを返すことを検証する
    user = models.User()
    db_session.add(user)
    db_session.commit()
    user_id = str(user.id)

    response = client.get(f"/users/{user_id}/courses")
    assert response.status_code == 200
    assert response.json() == []
# backend/tests/test_main.py のフィクスチャを修正
@pytest.fixture
def setup_user_and_course(db_session: Session):
    user = models.User()
    db_session.add(user)
    db_session.commit() # <-- 先にユーザーをコミットして ID を確定させる
    db_session.refresh(user) # <-- user.id を確実に取得

    course = models.Course(
        user_id=user.id, # <-- これで確定した user.id を使える
        total_distance_km=5.0,
        is_favorite=False,
        route_points=[{"lat": 35.0, "lng": 139.0}],
        drawing_points=[{"lat": 35.1, "lng": 139.1}]
    )
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    return user, course

# backend/tests/test_main.py の test_list_user_courses_with_data を修正

def test_list_user_courses_with_data(client: TestClient, db_session: Session, setup_user_and_course):
    user, course = setup_user_and_course
    user_id = str(user.id)
    expected_course_id = str(course.id) # <--- ★★★ API呼び出し前に ID を変数に保存 ★★★

    # 別のユーザーとコースも作成してみる
    other_user = models.User()
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    other_course = models.Course(user_id=other_user.id, total_distance_km=3.0, route_points=[], drawing_points=[])
    db_session.add(other_course)
    db_session.commit()

    response = client.get(f"/users/{user_id}/courses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1 # 対象ユーザーのコースのみが返ることを確認
    # assert data[0]["id"] == str(course.id) # <--- 元のオブジェクトにアクセスしない
    assert data[0]["id"] == expected_course_id # <--- ★★★ 保存しておいた ID 文字列と比較 ★★★
    assert data[0]["total_distance_km"] == 5.0
    assert data[0]["is_favorite"] is False
    assert data[0]["drawing_points"] is None # 一覧では drawing_points は null


def test_get_user_course_detail(client: TestClient, db_session: Session, setup_user_and_course):
    # 単一コースの詳細取得で正しいデータ（route_points と drawing_points を含む）が返ることを検証する
    user, course = setup_user_and_course
    user_id = str(user.id)
    course_id = str(course.id)

    response = client.get(f"/users/{user_id}/courses/{course_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == course_id
    assert data["total_distance_km"] == 5.0
    assert data["is_favorite"] is False
    assert data["route_points"] == [{"lat": 35.0, "lng": 139.0}]
    assert data["drawing_points"] == [{"lat": 35.1, "lng": 139.1}] # 詳細では drawing_points が返る

def test_get_user_course_detail_not_found(client: TestClient, db_session: Session, setup_user_and_course):
    # 存在しない course_id を指定した場合、404 が返ることを検証する
    user, _ = setup_user_and_course
    user_id = str(user.id)
    non_existent_course_id = str(uuid.uuid4())

    response = client.get(f"/users/{user_id}/courses/{non_existent_course_id}")
    # main.py の修正により、正しく 404 が返るはず
    assert response.status_code == 404 # <--- 500 から 404 に変更
    assert response.json()["detail"] == "Course not found" # エラーメッセージも確認

def test_get_user_course_detail_invalid_uuid(client: TestClient, db_session: Session, setup_user_and_course):
    # course_id の形式がUUIDでない場合に422が返ることを検証する
    user, _ = setup_user_and_course
    user_id = str(user.id)
    invalid_course_id = "invalid-uuid-format"

    response = client.get(f"/users/{user_id}/courses/{invalid_course_id}")
    assert response.status_code == 400

def test_delete_user_course(client: TestClient, db_session: Session, setup_user_and_course):
    # コース削除APIが204を返し、実際にDBから削除されることを検証する
    user, course = setup_user_and_course
    user_id = str(user.id)
    course_id = str(course.id)

    response = client.delete(f"/users/{user_id}/courses/{course_id}")
    assert response.status_code == 204 # No Content

    # DBから削除されたか確認
    deleted_course = db_session.query(models.Course).filter(models.Course.id == course_id).first()
    assert deleted_course is None

def test_delete_user_course_not_found(client: TestClient, db_session: Session, setup_user_and_course):
    # 存在しないコースを削除しようとすると404が返ることを検証する
    user, _ = setup_user_and_course
    user_id = str(user.id)
    non_existent_course_id = str(uuid.uuid4())

    response = client.delete(f"/users/{user_id}/courses/{non_existent_course_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Course not found."

def test_delete_user_course_wrong_user(client: TestClient, db_session: Session, setup_user_and_course):
    # 別ユーザーが他人のコースを削除できない（404が返る）ことを検証する
    _, course = setup_user_and_course # course は user1 のもの
    course_id = str(course.id)

    # 別のユーザーを作成
    other_user = models.User()
    db_session.add(other_user)
    db_session.commit()
    other_user_id = str(other_user.id)

    # other_user で user1 の course を削除しようとする
    response = client.delete(f"/users/{other_user_id}/courses/{course_id}")
    assert response.status_code == 404 # 存在しないか、権限がない
    assert response.json()["detail"] == "Course not found."

def test_toggle_course_favorite(client: TestClient, db_session: Session, setup_user_and_course):
    # toggle_favorite エンドポイントが is_favorite を反転させ、DBに保存されることを検証する
    user, course = setup_user_and_course
    user_id = str(user.id)
    course_id = str(course.id)

    assert course.is_favorite is False # 初期状態は False

    # 1回目のトグル (False -> True)
    response1 = client.post(f"/users/{user_id}/courses/{course_id}/toggle_favorite")
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["id"] == course_id
    assert data1["is_favorite"] is True

    # DBの状態も確認
    db_session.refresh(course)
    assert course.is_favorite is True

    # 2回目のトグル (True -> False)
    response2 = client.post(f"/users/{user_id}/courses/{course_id}/toggle_favorite")
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["id"] == course_id
    assert data2["is_favorite"] is False

    # DBの状態も確認
    db_session.refresh(course)
    assert course.is_favorite is False

def test_toggle_course_favorite_not_found(client: TestClient, db_session: Session, setup_user_and_course):
    # 存在しないコースで toggle を呼ぶと404が返ることを検証する
    user, _ = setup_user_and_course
    user_id = str(user.id)
    non_existent_course_id = str(uuid.uuid4())

    response = client.post(f"/users/{user_id}/courses/{non_existent_course_id}/toggle_favorite")
    assert response.status_code == 404
    assert response.json()["detail"] == "Course not found."
