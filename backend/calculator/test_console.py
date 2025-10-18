#
# ローカル環境でGPSArtGeneratorクラスの動作を確認するためのサンプルコード。
# 
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from backend.calculator.gps_art_generator import GPSArtGenerator
import matplotlib.pyplot as plt
import osmnx as ox
from shapely.geometry import Point

def create_sample_drawing_points():
    """
    元のcreate_raw_shape()と同じ形状データを返します。
    APIのリクエスト形式に合わせて変換済み。
    """
    raw_coords = [(304.0000, 64.0000), (290.0438, 86.4343), (276.2689, 110.4623), (263.4601, 135.0798), (250.7321, 159.6697), (238.8821, 184.7947), (226.7567, 209.7299), (215.7229, 235.1929), (205.7121, 261.0076), (195.9852, 287.0445), (185.9947, 313.0141), (177.1557, 339.3773), (167.3750, 365.2500), (157.0152, 390.9545), (147.9380, 417.1859), (137.1368, 442.7263), (126.2853, 468.1441), (116.2788, 493.8849), (107.2312, 520.0752), (97.9511, 546.0979), (100.2785, 556.7215), (120.2290, 538.4168), (140.8859, 519.8121), (162.9844, 503.0156), (185.0520, 486.1688), (207.4188, 469.6510), (229.5490, 452.9608), (250.4788, 434.6808), (272.6872, 418.0503), (296.0389, 402.9708), (318.4230, 386.5770), (340.4199, 369.5801), (362.9731, 353.5135), (386.1876, 338.2874), (408.7641, 322.2359), (429.7707, 304.0244), (452.0888, 287.5289), (474.6600, 271.4040), (496.4473, 254.2939), (518.0064, 236.9936), (537.8961, 218.1039), (522.0365, 218.0000), (494.3186, 220.2438), (466.5740, 222.0000), (438.8107, 223.5627), (411.0461, 225.0000), (383.2935, 226.7006), (355.5182, 228.0000), (327.7463, 229.0000), (299.9732, 229.8610), (272.1488, 230.0000), (244.3146, 230.0000), (216.4804, 230.0000), (188.6461, 230.0000), (160.8119, 230.0000), (133.0399, 229.0000), (105.3395, 227.5849), (77.7395, 226.0000), (50.3195, 227.0000), (49.9745, 234.9873), (74.1271, 247.9017), (95.9642, 265.1368), (117.6830, 282.5123), (139.6702, 299.5585), (161.2314, 317.0224), (183.3843, 333.7883), (205.6649, 350.4432), (229.4059, 364.8435), (254.0668, 377.5334), (279.1534, 389.5767), (304.3915, 401.0349), (329.2281, 413.5263), (355.0872, 423.7827), (381.1633, 433.4986), (406.2167, 445.5524), (431.9223, 456.1096), (457.7112, 466.4845), (483.0899, 477.6539), (507.9619, 489.9746), (530.0214, 506.0214), (547.0000, 521.2777), (534.2844, 496.9267), (517.0964, 475.1927), (499.1345, 454.1345), (479.9184, 434.9184), (463.2528, 412.8792), (449.7823, 388.5646), (435.7146, 364.7146), (420.7269, 341.4538), (407.5418, 317.0836), (395.7516, 292.1305), (386.0285, 266.0854), (374.9286, 240.7859), (363.7319, 215.3744), (351.4777, 190.4330), (340.4703, 164.9407), (330.7267, 138.9066), (319.1550, 114.1550), (310.0000, 90.5205), (300.0000, 68.0000)]
    
    return [{"x": x, "y": y} for x, y in raw_coords]

def test_api_format():
    """
    APIのリクエスト/レスポンス形式でのテスト
    """
    print("=== APIフォーマットテスト ===")
    
    # APIリクエストの作成
    api_request = {
        "drawing_display_points": create_sample_drawing_points(),
        "start_location": {
            "lat": 43.0686,
            "lng": 141.3508
        },
        "target_distance_km": 20.0
    }
    
    # ジェネレーターの初期化
    generator = GPSArtGenerator(cache_enabled=True)
    
    # コスト関数パラメータを元のスクリプトと同じに設定
    generator.set_cost_parameters(alpha=1.0, beta=5.0, gamma=1.0)
    
    # ルート計算の実行
    print("ルート計算を開始します...")
    result = generator.calculate_route(**api_request)
    
    # レスポンスの表示
    print("\n=== APIレスポンス ===")
    print(f"総距離: {result['total_distance_km']} km")
    print(f"ルートポイント数: {len(result['route_points'])}")
    print(f"描画ポイント数: {len(result['drawing_points'])}")
    
    # 最初の数ポイントを表示
    print("\n最初の3つのルートポイント:")
    for i, point in enumerate(result['route_points'][:3]):
        print(f"  {i+1}: lat={point['lat']:.6f}, lng={point['lng']:.6f}")
    
    # 計算結果を可視化
    visualize_result(result, generator)
    
    return result

def test_original_compatibility():
    """
    元のスクリプトと同じ動作を再現するテスト
    """
    print("\n=== 元のスクリプトとの互換性テスト ===")
    
    # ジェネレーターの初期化
    generator = GPSArtGenerator(cache_enabled=True)
    
    # 元のパラメータと同じ設定
    generator.set_cost_parameters(alpha=1.0, beta=5.0, gamma=5.0)
    generator.set_network_parameters(network_type="walk", distance=4000)
    
    # 元のスクリプトと同じリクエスト
    drawing_points = create_sample_drawing_points()
    start_location = {"lat": 43.0686, "lng": 141.3508}  # 札幌駅
    target_distance = 10.0
    
    # ルート計算
    result = generator.calculate_route(
        drawing_display_points=drawing_points,
        start_location=start_location,
        target_distance_km=target_distance
    )
    
    print(f"計算完了 - 総距離: {result['total_distance_km']} km")
    
    return result

def visualize_result(result, generator):
    """
    計算結果を可視化します（元のスクリプトと同様）
    """
    print("\n結果を可視化中...")
    
    road_network = generator.get_road_network()
    road_network_latlon = generator.get_road_network_latlon()

    if not road_network:
        print("可視化する道路ネットワークがありません。")
        return

    # 道路ネットワークをプロット
    fig, ax = ox.plot_graph(road_network, show=False, close=False, 
                           node_size=0, edge_color='gray', edge_linewidth=0.5)
    
    # 理想の形状をプロット（青い破線）
    if result['drawing_points']:
        drawing_lats = [p['lat'] for p in result['drawing_points']]
        drawing_lngs = [p['lng'] for p in result['drawing_points']]
        
        # 緯度経度をUTM座標に変換してプロット
        drawing_utm_coords = []
        for lng, lat in zip(drawing_lngs, drawing_lats):
            point_proj, _ = ox.projection.project_geometry(
                Point(lng, lat), 
                crs=road_network_latlon.graph['crs'], 
                to_crs=road_network.graph['crs']
            )
            x, y = point_proj.coords[0]
            drawing_utm_coords.append((x, y))
        
        if drawing_utm_coords:
            x_ideal, y_ideal = zip(*drawing_utm_coords)
            ax.plot(x_ideal, y_ideal, 'b--', linewidth=2, label='Ideal Shape')
    
    # 計算されたルートをプロット（赤い実線）
    if result['route_points']:
        route_lats = [p['lat'] for p in result['route_points']]
        route_lngs = [p['lng'] for p in result['route_points']]
        
        # ルートポイントをノードIDに逆変換
        import numpy as np
        route_node_ids = []
        all_nodes = list(road_network.nodes())
        all_coords = np.array([road_network.nodes[node]['coords'] 
                              for node in all_nodes])
        
        for lng, lat in zip(route_lngs, route_lats):
            # 緯度経度をUTM座標に変換
            point_proj, _ = ox.projection.project_geometry(
                Point(lng, lat), 
                crs=road_network_latlon.graph['crs'], 
                to_crs=road_network.graph['crs']
            )
            x, y = point_proj.coords[0]
            
            # 最も近いノードを探索
            distances = np.linalg.norm(all_coords - np.array([x, y]), axis=1)
            closest_idx = np.argmin(distances)
            route_node_ids.append(all_nodes[closest_idx])
        
        # ルートをプロット
        if route_node_ids:
            ox.plot_graph_route(road_network, route_node_ids, 
                               route_color='r', route_linewidth=3, 
                               node_size=0, ax=ax)
    
    # タイトルと凡例を設定
    ax.set_title(f"GPS Art Route (Total: {result['total_distance_km']} km)\n"
                f"Generated using GPSArtGenerator class")
    ax.legend()
    
    # グラフを表示
    plt.show()

if __name__ == "__main__":
    # APIフォーマットのテストを実行し、結果をプロット
    test_api_format()
