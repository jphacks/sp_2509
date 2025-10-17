"""
ユーティリティ関数集

このモジュールは GitHub Copilot の機能デモンストレーションとして作成されました。
開発で役立つ汎用的なヘルパー関数を提供します。
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import hashlib
import json


def get_jst_time() -> datetime:
    """
    現在の日本標準時 (JST) を取得する
    
    Returns:
        datetime: JST タイムゾーンの現在時刻
    """
    jst = timezone(timedelta(hours=9), 'JST')
    return datetime.now(jst)


def format_timestamp(dt: Optional[datetime] = None, format_str: str = '%Y-%m-%d %H:%M:%S') -> str:
    """
    日時をフォーマットされた文字列に変換する
    
    Args:
        dt: フォーマットする日時（Noneの場合は現在時刻）
        format_str: 出力フォーマット
        
    Returns:
        str: フォーマットされた日時文字列
    """
    if dt is None:
        dt = get_jst_time()
    return dt.strftime(format_str)


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    2点間の距離を計算する（簡易版 - ヒュベニの公式）
    
    Args:
        lat1: 地点1の緯度
        lng1: 地点1の経度
        lat2: 地点2の緯度
        lng2: 地点2の経度
        
    Returns:
        float: 2点間の距離（キロメートル）
    """
    import math
    
    # 地球の半径（km）
    R = 6371.0
    
    # ラジアンに変換
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    # ハバーサイン公式
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 3)


def generate_hash(data: str, algorithm: str = 'sha256') -> str:
    """
    文字列からハッシュ値を生成する
    
    Args:
        data: ハッシュ化する文字列
        algorithm: 使用するハッシュアルゴリズム（sha256, md5など）
        
    Returns:
        str: 16進数表記のハッシュ値
    """
    hash_func = getattr(hashlib, algorithm)()
    hash_func.update(data.encode('utf-8'))
    return hash_func.hexdigest()


def validate_uuid_format(uuid_str: str) -> bool:
    """
    文字列が有効なUUID形式かチェックする
    
    Args:
        uuid_str: チェックする文字列
        
    Returns:
        bool: 有効なUUID形式の場合True
    """
    import uuid
    try:
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False


def paginate_list(items: List[Any], page: int = 1, per_page: int = 10) -> Dict[str, Any]:
    """
    リストをページネーションする
    
    Args:
        items: ページネーションするリスト
        page: ページ番号（1から開始）
        per_page: 1ページあたりのアイテム数
        
    Returns:
        dict: ページネーション情報を含む辞書
            - items: 現在ページのアイテムリスト
            - total: 総アイテム数
            - page: 現在のページ番号
            - per_page: 1ページあたりのアイテム数
            - total_pages: 総ページ数
    """
    total = len(items)
    total_pages = (total + per_page - 1) // per_page  # 切り上げ除算
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return {
        'items': items[start_idx:end_idx],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
        'has_next': page < total_pages,
        'has_prev': page > 1
    }


def safe_json_parse(json_str: str, default: Any = None) -> Any:
    """
    JSON文字列を安全にパースする
    
    Args:
        json_str: パースするJSON文字列
        default: パースに失敗した場合のデフォルト値
        
    Returns:
        パースされたオブジェクト、または失敗時はdefault値
    """
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default


def clamp(value: float, min_value: float, max_value: float) -> float:
    """
    値を指定範囲内に制限する
    
    Args:
        value: 制限する値
        min_value: 最小値
        max_value: 最大値
        
    Returns:
        float: 制限された値
    """
    return max(min_value, min(max_value, value))


# デモンストレーション用のヘルパー関数
def demonstrate_capabilities() -> Dict[str, Any]:
    """
    このユーティリティモジュールの機能をデモンストレーションする
    
    Returns:
        dict: 各機能の実行結果
    """
    return {
        'current_jst_time': format_timestamp(),
        'distance_tokyo_to_osaka': calculate_distance(35.6762, 139.6503, 34.6937, 135.5023),
        'sample_hash': generate_hash('GitHub Copilot Demo'),
        'uuid_validation': {
            'valid': validate_uuid_format('f81d4fae-7dec-11d0-a765-00a0c91e6bf6'),
            'invalid': validate_uuid_format('not-a-uuid')
        },
        'pagination_example': paginate_list(list(range(1, 26)), page=2, per_page=10),
        'clamped_value': clamp(150, 0, 100)
    }
