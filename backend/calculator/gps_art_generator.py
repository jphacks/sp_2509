import osmnx as ox
from osmnx import projection
import networkx as nx
import numpy as np
from shapely.geometry import Point
from scipy.spatial import KDTree
from typing import List, Dict, Tuple, Optional
import json

class GPSArtGenerator:
    """
    GPSアート経路生成システムのメインクラス
    
    手書きの描画データから実際の道路網を使った最適なランニング/ウォーキングコースを生成
    """
    
    def __init__(self, cache_enabled: bool = True):
        """
        GPSArtGeneratorを初期化します。
        
        Args:
            cache_enabled (bool): OpenStreetMapデータのキャッシュを使用するか
        """
        ox.settings.use_cache = cache_enabled
        
        self.alpha = 1.0 #方向性の重み
        self.beta = 5.0 #効率性の重み
        self.gamma = 1.0 #形状忠実性の重み
        
        self.network_type = "walk"
        self.network_distance = 4000 #地図の取得する範囲（メートル）
        self.path_length_adjustment = 0.7 #目標距離の調整係数
        self.rotation_search_steps = 360 #経路角度探索のステップ数
        self.resample_points = 40 #経路探索のためにリサンプリングする点の数
        self.rotation_search_points = 200 #角度決定のためにリサンプリングする点の数
        self._road_network = None
        self._road_network_latlon = None
        self._anchor_point = None

    def get_road_network(self):
        """投影された道路ネットワーク(UTM)を返します。"""
        return self._road_network

    def get_road_network_latlon(self):
        """投影前の道路ネットワーク(緯度経度)を返します。"""
        return self._road_network_latlon

    def set_cost_parameters(self, alpha: float = None, beta: float = None, gamma: float = None):
        """
        コスト関数のパラメータを設定します。
        
        Args:
            alpha (float): 方向性の重み (ゴールへの近さ)
            beta (float): 効率性の重み (移動距離)
            gamma (float): 形状忠実性の重み (理想形状との近さ)
        """
        if alpha is not None:
            self.alpha = alpha
        if beta is not None:
            self.beta = beta
        if gamma is not None:
            self.gamma = gamma

    def set_network_parameters(self, network_type: str = None, distance: int = None):
        """
        道路ネットワークの取得パラメータを設定します。
        
        Args:
            network_type (str): ネットワークタイプ ("walk", "drive", "bike" など)
            distance (int): 取得範囲（メートル）
        """
        if network_type is not None:
            self.network_type = network_type
        if distance is not None:
            self.network_distance = distance

    def _load_road_network(self, center_lat: float, center_lon: float):
        """
        指定された中心点の周囲の道路ネットワークを取得・投影します。
        
        Args:
            center_lat (float): 中心点の緯度
            center_lon (float): 中心点の経度
        """
        if (self._anchor_point is None or 
            self._anchor_point != (center_lat, center_lon) or 
            self._road_network is None):
            
            print("道路ネットワークデータを取得中...")
            self._anchor_point = (center_lat, center_lon)
            
            self._road_network_latlon = ox.graph_from_point(
                self._anchor_point, 
                dist=self.network_distance, 
                network_type=self.network_type
            )
            
            print("グラフを投影中...")
            self._road_network = ox.project_graph(self._road_network_latlon)
            
            for node, data in self._road_network.nodes(data=True):
                data['coords'] = np.array([data['x'], data['y']])

    def _resample_shape(self, shape_points: List[Tuple[float, float]], num_points: int) -> List[Tuple[float, float]]:
        """
        形状のパスを等間隔の指定された数の点にリサンプリングします。
        """
        points = np.array(shape_points)
        segment_lengths = np.sqrt(np.sum(np.diff(points, axis=0)**2, axis=1))
        cumulative_lengths = np.insert(np.cumsum(segment_lengths), 0, 0)
        
        if cumulative_lengths[-1] == 0:
            return [tuple(points[0])] * num_points

        if num_points > 1:
            interval = cumulative_lengths[-1] / (num_points - 1)
        else:
            interval = 0
        
        new_points = []
        segment_index = 0
        
        for i in range(num_points):
            target_dist = i * interval
            
            while segment_index < len(segment_lengths) and target_dist > cumulative_lengths[segment_index + 1]:
                segment_index += 1
            
            if segment_index >= len(segment_lengths):
                segment_index = len(segment_lengths) - 1

            dist_in_segment = target_dist - cumulative_lengths[segment_index]
            segment_len = segment_lengths[segment_index]
            
            if segment_len == 0:
                fraction = 0.0
            else:
                fraction = dist_in_segment / segment_len
                
            p1 = points[segment_index]
            p2 = points[segment_index + 1]
            new_point = p1 + fraction * (p2 - p1)
            new_points.append(tuple(new_point))
            
        return new_points

    def _calculate_path_length(self, path: List[Tuple[float, float]]) -> float:
        """座標リストで定義されたパスの全長を計算します。"""
        length = 0
        for i in range(len(path) - 1):
            p1 = np.array(path[i])
            p2 = np.array(path[i+1])
            length += np.linalg.norm(p2 - p1)
        return length

    def _create_scaled_geo_path(self, raw_path: List[Tuple[float, float]], 
                               anchor_lat: float, anchor_lon: float, 
                               target_path_km: float) -> List[Tuple[float, float]]:
        """
        生の座標パスを、指定されたパス長になるようにスケーリングし、
        アンカーポイントを基準に地理座標に変換します。
        """
        if not raw_path:
            return []

        target_path_meters = target_path_km * 1000
        current_path_length = self._calculate_path_length(raw_path)
        
        if current_path_length == 0:
            return [(anchor_lon, anchor_lat)] * len(raw_path)

        scale_factor = target_path_meters / current_path_length

        scaled_path_meters = []
        anchor_point_raw = np.array(raw_path[0])
        for point in raw_path:
            scaled_point = (np.array(point) - anchor_point_raw) * scale_factor
            scaled_path_meters.append(scaled_point)

        EARTH_RADIUS = 6378137
        m_per_deg_lat = (2 * np.pi * EARTH_RADIUS) / 360
        m_per_deg_lon = m_per_deg_lat * np.cos(np.radians(anchor_lat))

        geo_path = []
        for x_meter, y_meter in scaled_path_meters:
            lat_offset = -y_meter / m_per_deg_lat
            lon_offset = x_meter / m_per_deg_lon
            
            lat = anchor_lat + lat_offset
            lon = anchor_lon + lon_offset
            geo_path.append((lon, lat))
            
        return geo_path

    def _rotate_shape(self, shape_points: List[Tuple[float, float]], 
                     angle_deg: float) -> List[Tuple[float, float]]:
        """形状を指定された角度で回転させます。"""
        angle_rad = np.radians(angle_deg)
        rotation_matrix = np.array([
            [np.cos(angle_rad), -np.sin(angle_rad)],
            [np.sin(angle_rad),  np.cos(angle_rad)]
        ])
        
        anchor_point = np.array(shape_points[0])
        rotated_shape = [(rotation_matrix @ (point - anchor_point)) + anchor_point 
                        for point in shape_points]
        
        return rotated_shape

    def _find_best_rotation(self, base_shape_proj: List[np.ndarray]) -> float:
        """
        理想形状を様々な角度で回転させ、道路網に最もフィットする角度を見つけます。
        """
        print(f"最適な回転角度の探索を開始します（{self.rotation_search_steps} ステップ）...")
        best_angle = 0
        min_total_distance = float('inf')

        all_node_coords = np.array([self._road_network.nodes[node]['coords'] 
                                  for node in self._road_network.nodes()])
        node_tree = KDTree(all_node_coords)

        for i in range(self.rotation_search_steps):
            angle = (360 / self.rotation_search_steps) * i
            rotated_shape = self._rotate_shape(base_shape_proj, angle)
            
            distances, _ = node_tree.query(rotated_shape)
            total_error = np.sum(distances ** 4)

            if total_error < min_total_distance:
                min_total_distance = total_error
                best_angle = angle
                print(f"  - 新しい最適角度: {angle:.1f}度 (合計距離: {total_error:.2f})")

        print(f"探索完了。最適な回転角度: {best_angle:.1f}度")
        return best_angle

    def _cost_c1(self, node_coords: np.ndarray, target_coords: np.ndarray) -> float:
        """コスト関数 C1: 方向性（ゴールへの近さ）"""
        return np.linalg.norm(node_coords - target_coords)

    def _cost_c2(self, prev_coords: np.ndarray, node_coords: np.ndarray) -> float:
        """コスト関数 C2: 効率性（移動距離）"""
        return np.linalg.norm(node_coords - prev_coords)

    def _cost_c3(self, prev_coords: np.ndarray, node_coords: np.ndarray,
                segment_start: np.ndarray, segment_end: np.ndarray, 
                num_samples: int = 10) -> float:
        """コスト関数 C3: 形状忠実性（理想形状との近さ）"""
        edge_vec = node_coords - prev_coords
        edge_len_sq = np.dot(edge_vec, edge_vec)
        
        if edge_len_sq == 0:
            return np.linalg.norm(prev_coords - segment_start) * num_samples
        
        total_dist = 0
        for k in range(num_samples):
            sample_point = segment_start + (segment_end - segment_start) * (k / (num_samples - 1))
            t = np.dot(sample_point - prev_coords, edge_vec) / edge_len_sq
            
            if t < 0:
                dist = np.linalg.norm(sample_point - prev_coords)
            elif t > 1:
                dist = np.linalg.norm(sample_point - node_coords)
            else:
                projection = prev_coords + t * edge_vec
                dist = np.linalg.norm(sample_point - projection)
            total_dist += dist
        return total_dist

    def _create_weight_function(self, segment_start: np.ndarray, segment_end: np.ndarray):
        """3つのコスト関数を統合した重み関数を作成します。"""
        def weight_func(u, v, d):
            prev_coords = self._road_network.nodes[u]['coords']
            node_coords = self._road_network.nodes[v]['coords']
            
            c1 = self._cost_c1(node_coords, segment_end)
            c2 = self._cost_c2(prev_coords, node_coords)
            c3 = self._cost_c3(prev_coords, node_coords, segment_start, segment_end)
            
            return self.alpha * c1 + self.beta * c2 + self.gamma * c3
        return weight_func

    def _find_route_for_shape(self, shape_points: List[np.ndarray]) -> List:
        """指定された形状全体を描くためのルートを探索します。"""
        full_route = []
        all_node_coords = np.array([self._road_network.nodes[node]['coords'] 
                                  for node in self._road_network.nodes()])
        all_node_ids = list(self._road_network.nodes())
        
        start_idx = np.argmin(np.linalg.norm(all_node_coords - shape_points[0], axis=1))
        start_node = all_node_ids[start_idx]
        current_node = start_node
        
        for i in range(len(shape_points) - 1):
            segment_start = shape_points[i]
            segment_end = shape_points[i+1]
            
            target_idx = np.argmin(np.linalg.norm(all_node_coords - segment_end, axis=1))
            target_node = all_node_ids[target_idx]
            
            if current_node == target_node:
                continue
            
            weight_function = self._create_weight_function(segment_start, segment_end)
            
            try:
                path = nx.dijkstra_path(self._road_network, current_node, target_node, 
                                      weight=weight_function)
                
                if not full_route:
                    full_route.extend(path)
                else:
                    full_route.extend(path[1:])
                
                current_node = path[-1]
            except nx.NetworkXNoPath:
                print(f"  - ルートが見つかりませんでした。このセグメントをスキップします。")
                continue
                
        return full_route

    def _calculate_route_length_km(self, route_nodes: List) -> float:
        """計算されたルートの全長をキロメートル単位で計算します。"""
        if not route_nodes or len(route_nodes) < 2:
            return 0.0
            
        total_length_m = 0
        for u, v in zip(route_nodes[:-1], route_nodes[1:]):
            length = min(edge['length'] 
                        for edge in self._road_network.get_edge_data(u, v).values())
            total_length_m += length
        
        return round(total_length_m / 1000, 1)

    def _convert_route_to_latlon(self, route_nodes: List) -> List[Dict[str, float]]:
        """UTM座標系のルートを緯度経度に変換します。"""
        route_points = []
        for node in route_nodes:
            x, y = self._road_network.nodes[node]['x'], self._road_network.nodes[node]['y']
            
            point_utm = Point(x, y)
            point_latlon, _ = projection.project_geometry(
                point_utm, 
                crs=self._road_network.graph['crs'], 
                to_crs=self._road_network_latlon.graph['crs']
            )
            
            lon, lat = point_latlon.coords[0]
            route_points.append({"lat": lat, "lng": lon})
            
        return route_points

    def calculate_route(self, drawing_display_points: List[Dict[str, float]], 
                       start_location: Dict[str, float], 
                       target_distance_km: float) -> Dict:
        """
        メインのAPI関数：手書きデータから最適なコースを計算します。
        
        Args:
            drawing_display_points: 手書きの座標点 [{"x": float, "y": float}, ...]
            start_location: 開始地点 {"lat": float, "lng": float}
            target_distance_km: 目標距離（km）
            
        Returns:
            計算結果のDict（APIレスポンス形式）
        """
        raw_shape_points = [(point["x"], point["y"]) for point in drawing_display_points]
        anchor_lat = start_location["lat"]
        anchor_lon = start_location["lng"]
        
        self._load_road_network(anchor_lat, anchor_lon)
        
        resampled_shape = self._resample_shape(raw_shape_points, self.resample_points)
        
        adjusted_target_km = target_distance_km * self.path_length_adjustment
        
        target_shape_latlon = self._create_scaled_geo_path(
            resampled_shape, anchor_lat, anchor_lon, adjusted_target_km
        )
        
        base_target_shape_proj = []
        for lon, lat in target_shape_latlon:
            point_proj, _ = projection.project_geometry(
                Point(lon, lat), 
                crs=self._road_network_latlon.graph['crs'], 
                to_crs=self._road_network.graph['crs']
            )
            base_target_shape_proj.append(np.array(point_proj.coords[0]))
        
        rotation_search_shape = self._resample_shape(raw_shape_points, self.rotation_search_points)
        rotation_search_latlon = self._create_scaled_geo_path(
            rotation_search_shape, anchor_lat, anchor_lon, adjusted_target_km
        )
        rotation_search_proj = []
        for lon, lat in rotation_search_latlon:
            point_proj, _ = projection.project_geometry(
                Point(lon, lat), 
                crs=self._road_network_latlon.graph['crs'], 
                to_crs=self._road_network.graph['crs']
            )
            rotation_search_proj.append(np.array(point_proj.coords[0]))
        
        best_angle = self._find_best_rotation(rotation_search_proj)
        
        target_shape_proj = self._rotate_shape(base_target_shape_proj, best_angle)
        
        print("最適な形状でルート探索を開始します。")
        route_nodes = self._find_route_for_shape(target_shape_proj)
        
        total_distance_km = self._calculate_route_length_km(route_nodes)
        route_points = self._convert_route_to_latlon(route_nodes)
        
        rotated_drawing_points_latlon = []
        for point_utm_coords in target_shape_proj:
            point_utm = Point(point_utm_coords)
            point_latlon, _ = projection.project_geometry(
                point_utm,
                crs=self._road_network.graph['crs'],
                to_crs=self._road_network_latlon.graph['crs']
            )
            lon, lat = point_latlon.coords[0]
            rotated_drawing_points_latlon.append({"lat": lat, "lng": lon})

        return {
            "total_distance_km": total_distance_km,
            "route_points": route_points,
            "drawing_points": rotated_drawing_points_latlon
        }
