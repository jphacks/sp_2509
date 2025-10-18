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
    raw_coords = [(275.0000, 422.0000), (271.8247, 420.8247), (268.9423, 418.9423), (266.0599, 417.0599), (262.8846, 415.8846), (260.0030, 414.0000), (257.0000, 412.7551), (254.5072, 411.0000), (251.6735, 409.0000), (248.8398, 407.0000), (246.7114, 404.7114), (244.1219, 402.1219), (242.6537, 399.6537), (241.0000, 397.2623), (239.3031, 394.3031), (238.0000, 391.1807), (237.0000, 387.9328), (236.0000, 384.6848), (235.0000, 382.0227), (233.0000, 379.7748), (231.6654, 376.6654), (231.0000, 373.2789), (229.0310, 371.0000), (228.0000, 367.7831), (228.0000, 364.1210), (227.0000, 360.8730), (227.0000, 357.2109), (227.0000, 353.5488), (227.0000, 349.8866), (227.0000, 346.2245), (227.0000, 342.5624), (227.0000, 338.9002), (228.0000, 336.2381), (229.7140, 333.2860), (232.0000, 330.5707), (234.0000, 328.3228), (236.9251, 327.0000), (239.8295, 325.1705), (242.4210, 324.0000), (245.6689, 323.0000), (248.9412, 322.0588), (252.5790, 322.0000), (256.2411, 322.0000), (258.0000, 323.9032), (261.0000, 325.1512), (262.5751, 327.5751), (265.0000, 330.2328), (266.0000, 333.4807), (267.0000, 336.1428), (268.0000, 338.8050), (269.0000, 341.4671), (270.0000, 344.7150), (271.0000, 347.3772), (271.7349, 345.2651), (272.0000, 341.7128), (273.0000, 338.4649), (274.0000, 335.2169), (276.3148, 333.6852), (279.1972, 331.8028), (282.5268, 331.0000), (285.7747, 330.0000), (289.4369, 330.0000), (293.0990, 330.0000), (296.7611, 330.0000), (300.4233, 330.0000), (303.0604, 331.0604), (306.2357, 332.2357), (309.1670, 334.0000), (311.0000, 335.8292), (313.7616, 337.7616), (315.0000, 340.3250), (315.0000, 343.9872), (315.0000, 347.6493), (314.0727, 350.9273), (312.8974, 354.1026), (311.0150, 356.9850), (309.7732, 360.0000), (308.0000, 362.4747), (306.1962, 364.8038), (305.0000, 367.3847), (303.2598, 369.7402), (301.0844, 371.9156), (299.6162, 374.3838), (297.4409, 376.5591), (295.9727, 379.0273), (294.0000, 381.8723), (292.0000, 384.1202), (290.4468, 386.5532), (288.9786, 389.0214), (288.0000, 392.2782), (287.0000, 394.9403), (285.0000, 397.1882), (284.0000, 400.4361), (282.5163, 403.4837), (280.4822, 406.0000), (279.0000, 408.7657), (277.0000, 410.4278), (275.9101, 413.0000), (274.0000, 414.7521), (272.0000, 417.0000)]
    
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
