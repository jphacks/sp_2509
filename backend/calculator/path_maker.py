import pygame
import numpy as np
from scipy import interpolate

# --- 定数設定 ---
SCREEN_WIDTH = 600
SCREEN_HEIGHT = 600
BG_COLOR = (0, 0, 0)
LINE_COLOR = (255, 255, 255)
LINE_WIDTH = 4
TARGET_POINTS = 100 # リサンプリング後の点の数

def resample_path(points, num_points):
    if len(points) < 2:
        return points
        
    # リストをNumPy配列に変換
    points = np.array(points)
    
    # 各点間の距離を計算し、累積和を求める
    distances = np.cumsum(np.sqrt(np.sum(np.diff(points, axis=0)**2, axis=1)))
    # 始点(距離0)を配列の先頭に追加
    distances = np.insert(distances, 0, 0)

    # 線形補間を行うための関数を作成
    interpolator = interpolate.interp1d(distances, points, axis=0, kind='linear')

    # パスの全長にわたって、指定した数で等間隔な距離の点を生成
    new_distances = np.linspace(0, distances[-1], num_points)

    # 新しい座標を補間して取得
    new_points = interpolator(new_distances)
    
    # Python標準のタプルのリスト形式に戻して返す
    return [tuple(p) for p in new_points]

def normalize_coordinates(points, width, height):
    """ピクセル座標を-1から1の範囲に正規化する（上下反転版）"""
    normalized = []
    for x, y in points:
        # x座標: [0, width] -> [-1, 1]
        norm_x = (x / width) * 2 - 1
        
        # y座標: [0, height] -> [-1, 1] (上が-1, 下が1)
        # y軸の向きを反転させないバージョン
        norm_y = (y / height) * 2 - 1
        
        normalized.append((norm_x, norm_y))
    return normalized

def main():
    """メインの処理"""
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption(f"マウスで描画 (閉じると{TARGET_POINTS}点にリサンプリングします)")

    running = True
    drawing = False
    points = []
    last_pos = None
    screen.fill(BG_COLOR)

    # --- メインループ ---
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                drawing = True
                # 新しい描画を開始する前に画面とポイントをクリア
                screen.fill(BG_COLOR)
                points = [event.pos]
                last_pos = event.pos
            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                drawing = False
                last_pos = None
            elif event.type == pygame.MOUSEMOTION and drawing:
                current_pos = event.pos
                pygame.draw.line(screen, LINE_COLOR, last_pos, current_pos, LINE_WIDTH)
                points.append(current_pos)
                last_pos = current_pos
        
        pygame.display.flip()

    # --- 終了処理 ---
    pygame.quit()
    
    if len(points) > 1:
        # 1. 描画したパスをリサンプリング
        print(f"🖌️ 元のパスの点数: {len(points)}")
        resampled = resample_path(points, num_points=TARGET_POINTS)
        print(f"🎯 リサンプリング後の点数: {len(resampled)}")

        # 2. リサンプリング後のパスを正規化
        #normalized_points = normalize_coordinates(resampled, SCREEN_WIDTH, SCREEN_HEIGHT)

        # 3. 結果を出力
        print("\n✅ リサンプリングおよび正規化されたパスの座標を出力します。")
        formatted_points = ", ".join([f"({p[0]:.4f}, {p[1]:.4f})" for p in resampled])
        print(f"path = [{formatted_points}]")
    else:
        print("座標は記録されませんでした。")

if __name__ == '__main__':
    main()