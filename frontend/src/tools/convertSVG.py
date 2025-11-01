import numpy as np
import re
import json
import xml.etree.ElementTree as ET # XML解析ライブラリ

# --- 設定 ---

# 3次ベジェ曲線をサンプリングする点の数。大きいほど滑らかに。
SAMPLES_PER_CURVE = 20

# アプリの描画キャンバスの中心座標
TARGET_CENTER_X = 175.0
TARGET_CENTER_Y = 175.0

# ターゲットとする図形のおおよそのサイズ（ピクセル）
# (他の図形データが 200-250px 程度なので、それに合わせる)
TARGET_SIZE = 210.0

# --- アルゴリズム本体 ---

def cubic_bezier(p0, p1, p2, p3, t):
    """3次ベジェ曲線を計算する関数 (Numpy使用)"""
    p0 = np.array(p0)
    p1 = np.array(p1)
    p2 = np.array(p2)
    p3 = np.array(p3)
    # (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
    return (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3

def scale_and_format_points(all_points, target_size, target_center_x, target_center_y):
    """
    点群全体をスケーリングし、中央揃えにして、
    JSオブジェクト形式 ({ x: ..., y: ... }) の文字列リストに変換します。
    """
    
    if not all_points or len(all_points) < 2:
        print("[警告] 点が2つ未満のため、スケーリングをスキップします。")
        return [] # 有効な線が描けない

    np_points = np.array(all_points)
    
    # 座標の最小値・最大値を計算 (制御点を含まない実際の描画点のみ)
    min_x, min_y = np_points.min(axis=0)
    max_x, max_y = np_points.max(axis=0)
    
    svg_width = max_x - min_x
    svg_height = max_y - min_y
    
    if svg_width == 0 and svg_height == 0:
        # 点が1つしかない (または全点が同一座標)
        print("[警告] 図形の幅と高さが0です。")
        scaled_x = target_center_x
        scaled_y = target_center_y
        return [f"{{ x: {scaled_x:.2f}, y: {scaled_y:.2f} }}"]

    # スケーリングファクタ（縦横比維持）
    # 0除算を避けるため max(..., 1e-6) を追加
    scale = target_size / max(svg_width, svg_height, 1e-6)
        
    scaled_width = svg_width * scale
    scaled_height = svg_height * scale
    
    # オフセット計算 (スケーリング後の図形が中央に来るように)
    offset_x = target_center_x - (scaled_width / 2)
    offset_y = target_center_y - (scaled_height / 2)
    
    transformed_points = []
    for x, y in np_points:
        # 1. 最小値を引いて (0,0) 開始に
        # 2. スケーリング
        # 3. オフセット追加
        scaled_x = (x - min_x) * scale + offset_x
        # SVGのY軸(下向き正)をアプリの座標系(下向き正)に合わせる
        scaled_y = (y - min_y) * scale + offset_y 
        
        transformed_points.append(f"{{ x: {scaled_x:.2f}, y: {scaled_y:.2f} }}")
        
    return transformed_points

def parse_svg_path(path_data, samples_per_curve=20):
    """
    SVGのパスデータ(d属性)を解析し、点群のリストに変換します。
    Mコマンドでパスが分割されている場合、セグメントのリスト(点のリストのリスト)として返します。
    """
    # 正規表現でコマンドと引数を分離
    path_regex = r'([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)'
    commands = re.findall(path_regex, path_data)
    
    segments = []
    current_segment_points = []
    current_pos = np.array([0.0, 0.0])
    
    try:
        for cmd_char, args_str in commands:
            cmd = cmd_char.upper()
            args_str = args_str.strip()
            # 数値を抽出（浮動小数点、マイナス符号、指数表記に対応）
            args = [float(n) for n in re.findall(r"[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?", args_str)]
            
            # M (Move To) - 新しいセグメントの開始
            if cmd == 'M':
                # 前のセグメントがあれば保存
                if current_segment_points:
                    segments.append(current_segment_points)
                
                # 座標を更新
                if cmd_char == 'M': # 絶対座標
                    current_pos = np.array([args[0], args[1]])
                elif cmd_char == 'm': # 相対座標
                    current_pos += np.array([args[0], args[1]])
                
                # 新しいセグメントを開始
                current_segment_points = [tuple(current_pos)]
                
                # 暗黙的な Line To (Mコマンドの後に続く座標ペア)
                implicit_cmd = 'L' if cmd_char == 'M' else 'l'
                for i in range(2, len(args), 2):
                    if implicit_cmd == 'L':
                        current_pos = np.array([args[i], args[i+1]])
                    else: # 'l'
                        current_pos += np.array([args[i], args[i+1]])
                    current_segment_points.append(tuple(current_pos))
            
            # L (Line To)
            elif cmd == 'L':
                if cmd_char == 'L': # 絶対
                    for i in range(0, len(args), 2):
                        current_pos = np.array([args[i], args[i+1]])
                        current_segment_points.append(tuple(current_pos))
                elif cmd_char == 'l': # 相対
                    for i in range(0, len(args), 2):
                        current_pos += np.array([args[i], args[i+1]])
                        current_segment_points.append(tuple(current_pos))

            # V (Vertical Line To)
            elif cmd == 'V':
                if cmd_char == 'V': # 絶対
                    for y in args:
                        current_pos = np.array([current_pos[0], y])
                        current_segment_points.append(tuple(current_pos))
                elif cmd_char == 'v': # 相対
                    for y in args:
                        current_pos = np.array([current_pos[0], current_pos[1] + y])
                        current_segment_points.append(tuple(current_pos))

            # H (Horizontal Line To)
            elif cmd == 'H':
                if cmd_char == 'H': # 絶対
                    for x in args:
                        current_pos = np.array([x, current_pos[1]])
                        current_segment_points.append(tuple(current_pos))
                elif cmd_char == 'h': # 相対
                    for x in args:
                        current_pos = np.array([current_pos[0] + x, current_pos[1]])
                        current_segment_points.append(tuple(current_pos))

            # C (Cubic Bezier)
            elif cmd == 'C':
                if cmd_char == 'C': # 絶対座標
                    for i in range(0, len(args), 6):
                        p0 = current_pos
                        p1 = np.array([args[i], args[i+1]])
                        p2 = np.array([args[i+2], args[i+3]])
                        p3 = np.array([args[i+4], args[i+5]])
                        # 補間 (始点は重複するので 1: から)
                        for t_val in np.linspace(0, 1, samples_per_curve)[1:]:
                            point = cubic_bezier(p0, p1, p2, p3, t_val)
                            current_segment_points.append(tuple(point))
                        current_pos = p3
                elif cmd_char == 'c': # 相対座標
                    for i in range(0, len(args), 6):
                        p0 = current_pos
                        p1 = current_pos + np.array([args[i], args[i+1]])
                        p2 = current_pos + np.array([args[i+2], args[i+3]])
                        p3 = current_pos + np.array([args[i+4], args[i+5]])
                        for t_val in np.linspace(0, 1, samples_per_curve)[1:]:
                            point = cubic_bezier(p0, p1, p2, p3, t_val)
                            current_segment_points.append(tuple(point))
                        current_pos = p3
            
            # Z (Close Path)
            elif cmd == 'Z':
                if current_segment_points:
                    # 始点と終点が違えば、始点を追加してパスを閉じる
                    if current_segment_points[0] != current_segment_points[-1]:
                         current_segment_points.append(current_segment_points[0])
                    # 現在地を始点に戻す
                    current_pos = np.array(current_segment_points[0])

            # 注: S (Smooth bezier), Q (Quadratic bezier), A (Arc) は未対応です。
            # 必要に応じて追加してください。

        # 最後のセグメントを追加
        if current_segment_points:
            segments.append(current_segment_points)

    except Exception as e:
        print(f"[エラー] パス解析中に例外発生: {e}")
        print(f"  コマンド: {cmd_char}, 引数文字列: {args_str}")
        return None

    return segments

def process_svg_file_content(svg_content):
    """SVGファイルの内容(文字列)を解析し、すべての<path>を点群データに変換して出力します。"""
    
    # SVGのデフォルトネームスペース
    # (Figmaエクスポートなど、ネームスペースがない場合も考慮)
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}
    
    try:
        # 文字列からXMLをパース
        root = ET.fromstring(svg_content)
        
        # すべての <path> 要素を検索 (ネームスペース指定)
        paths = root.findall('.//svg:path', namespaces)
        
        if not paths:
            # ネームスペースなしも試す
            paths = root.findall('.//path')
            if not paths:
                print("[エラー] SVG内に <path> 要素が見つかりませんでした。")
                return

        print(f"--- {len(paths)}個の <path> 要素が見つかりました ---")
        
        output_js_code = ""
        shape_count = 1

        for path_element in paths:
            path_data = path_element.get('d')
            if not path_data:
                print(f"[スキップ] <path> に 'd' 属性がありません。")
                continue
                
            # 変数名を決定 (idがあればそれを、なければ連番)
            shape_id = path_element.get('id')
            if shape_id:
                # JavaScriptの変数名として使えるようにサニタイズ
                # (例: "heart-path_1" -> "heart_path_1Shape")
                var_name = re.sub(r'[^a-zA-Z0-9_]', '_', shape_id)
                var_name = re.sub(r'^[^a-zA-Z_]+', '', var_name) # 先頭が数字なら削除
                if not var_name:
                    var_name = f"shape{shape_count}"
                var_name += "Shape"
            else:
                var_name = f"shape{shape_count}Shape"
                shape_count += 1
            
            print(f"\n処理中: {var_name} (d={path_data[:40]}...)")

            # 1. SVGパスを解析 -> セグメントのリストを取得
            path_segments = parse_svg_path(path_data, samples_per_curve=SAMPLES_PER_CURVE)
            
            if not path_segments:
                print(f"[エラー] {var_name} のパス解析に失敗しました。")
                continue

            # 2. パスを連結
            #    (Mコマンドで分割されていても、一つの図形として単純連結する)
            all_points = [point for segment in path_segments for point in segment]
            
            if len(all_points) < 2:
                print(f"[スキップ] {var_name} には有効な点群がありません（2点未満）。")
                continue

            # 3. スケーリングとフォーマット
            formatted_points_list = scale_and_format_points(
                all_points,
                TARGET_SIZE,
                TARGET_CENTER_X,
                TARGET_CENTER_Y
            )
            
            if not formatted_points_list:
                print(f"[エラー] {var_name} のスケーリングに失敗しました。")
                continue
                
            # 4. 最終的な出力を整形
            output_js_code += f"// {var_name} (from path id: {shape_id})\n"
            output_js_code += f"const {var_name}: Point[] = [\n  "
            output_js_code += ", ".join(formatted_points_list)
            output_js_code += "\n];\n\n"

        print("\n" + "="*30)
        print(" 変換完了 ")
        print("="*30)
        print("以下のデータを frontend/src/app/draw/page.tsx にコピーしてください：")
        print("\n" + output_js_code)

    except ET.ParseError as e:
        print(f"[致命的エラー] SVGのXML解析に失敗しました: {e}")
        print("SVGファイルの内容が正しいか確認してください。")
    except Exception as e:
        print(f"[致命的エラー] 予期しないエラーが発生しました: {e}")

# --- メイン実行部分 ---
if __name__ == "__main__":
    
    # ▼▼▼ ここにFigmaなどからコピーしたSVGファイル全体の「内容」を貼り付け ▼▼▼
    # (例: <svg width="125" ...> ... </svg>)
    
    INPUT_SVG_FILE_CONTENT = """
<svg xmlns="http://www.w3.org/2000/svg" width="125" height="108" viewBox="0 0 125 108" fill="none">
  <path id="heart_path" d="M62.0003 107L111.5 56.5013C111.5 56.5013 139.001 26.0573 111.5 5.99967C83.9997 -14.0579 62.0003 28 62.0003 28M62.2224 106.921L20.5 65.5M12.7224 56.5013C12.7224 56.5013 -14.7781 25.9786 12.7224 5.92106C40.223 -14.1365 62.2224 27.9213 62.2224 27.9213" stroke="black"/>
  
  <path d="M50 5 L61.8 38.2 L98 38.2 L68.2 61.8 L79 95 L50 76 L21 95 L31.8 61.8 L2 38.2 L38.2 38.2 L50 5 Z" fill="none" stroke="black"/>

  <path id="note_path" d="M32.1106 92.5891C32.1106 92.5891 32.1106 113.761 12.3855 110.737C5.70729 109.713 0.360105 103.528 1.71468 96.9089C4.25494 84.4961 18.6494 84.0569 24.3173 84.3795C25.5362 84.4488 26.6105 83.4931 26.6105 82.2723V16.2143C26.6105 15.2674 27.2746 14.4503 28.2015 14.2566L60.1106 7.58905L92.2402 1.53563C93.4715 1.30364 94.6105 2.24806 94.6105 3.50105V29.5034C94.6105 30.4322 93.971 31.2388 93.0666 31.4507L40.6544 43.7274C39.7501 43.9393 39.1106 44.7459 39.1106 45.6747V52.0442C39.1106 53.3401 40.3241 54.2939 41.5833 53.9876L92.1378 41.6905C93.397 41.3842 94.6105 42.338 94.6105 43.6339V65.7376C94.6105 68.81 91.8513 71.2096 88.7802 71.2986C82.2025 71.4893 72.1498 73.5296 70.0987 83.9102C69.0461 89.2373 73.059 94.2732 78.3956 95.2767C97.8572 98.936 100.611 78.0891 100.611 78.0891" stroke="black" stroke-width="3"/>
</svg>
    """
    # ▲▲▲ ここまで ▲▲▲
    
    # スクリプト実行
    process_svg_file_content(INPUT_SVG_FILE_CONTENT)