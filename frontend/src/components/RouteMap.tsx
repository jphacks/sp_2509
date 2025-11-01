// "use client";

// import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import { LatLngExpression, divIcon, LatLngBounds } from "leaflet";
// import { useEffect } from "react";
// import dynamic from "next/dynamic";
// import { startIcon, goalIcon } from "./MapIcons";

// const GradientPolyline = dynamic(
//   () => import("./MapComponents").then((mod) => mod.GradientPolyline),
//   { ssr: false }
// );

// type CSSSize = number | string;

// interface RouteMapProps {
//   /** route_points用の座標（青い線） */
//   positions?: LatLngExpression[];
//   /** drawing_points用の座標（赤い線） */
//   secondaryPositions?: LatLngExpression[];
//   /** 実コンテナの高さ（fitBoundsのズーム決定に影響） */
//   height?: CSSSize;
//   /** 実コンテナの幅（fitBoundsのズーム決定に影響） */
//   width?: CSSSize;
//   /** fitBoundsの余白(px)。大きいほど引き気味 */
//   padding?: number;
//   /** 近づきすぎ防止の上限ズーム */
//   maxZoom?: number;
//   /** 地図の操作（ズーム・ドラッグ）を許可するか */
//   interactive?: boolean; // default: true
//   /** ズームコントロールボタンを表示するか */
//   showZoomControl?: boolean; // default: true
//   /** ★ 描画モード（trueならfitBoundsを無効化） */
//   isDrawingMode?: boolean;
// }

// const FitBounds = ({
//   positions,
//   secondaryPositions,
//   padding = 5,
//   maxZoom = 16,
//   isDrawingMode = false, // ★ 追加
// }: {
//   positions?: LatLngExpression[];
//   secondaryPositions?: LatLngExpression[];
//   padding?: number;
//   maxZoom?: number;
//   isDrawingMode?: boolean; // ★ 追加
// }) => {
//   const map = useMap();

//   useEffect(() => {
//     // ★ 描画モード中はfitBoundsを実行しない
//     if (isDrawingMode) return;

//     const allPositions = [...(positions || []), ...(secondaryPositions || [])];
//     if (allPositions.length === 0) return;
//     const bounds = new LatLngBounds(allPositions);
//     map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
//   }, [positions, secondaryPositions, padding, maxZoom, map, isDrawingMode]); // ★ 依存配列に追加

//   return null;
// };

// const RouteMap = ({
//   positions,
//   secondaryPositions,
//   height = 400,
//   width = "100%",
//   padding = 5,
//   maxZoom = 16,
//   interactive = true,
//   showZoomControl = true,
//   isDrawingMode = false, // ★ 追加
// }: RouteMapProps) => {
//   const h = typeof height === "number" ? `${height}px` : height;
//   const w = typeof width === "number" ? `${width}px` : width;

//   // スタートとゴールの位置を決定
//   const startPosition = positions?.[0] || secondaryPositions?.[0];
//   const goalPosition =
//     positions && positions.length > 1
//       ? positions[positions.length - 1]
//       : null;

//   return (
//     <MapContainer
//       style={{ height: h, width: w }}
//       attributionControl={false}
//       zoomControl={showZoomControl}
//       dragging={interactive}
//       touchZoom={interactive}
//       doubleClickZoom={interactive}
//       scrollWheelZoom={interactive}
//       boxZoom={interactive}
//       keyboard={interactive}
//     >
//       <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

//       {/* drawing_points: 赤い線 */}
//       {secondaryPositions && secondaryPositions.length > 0 && (
//         <Polyline positions={secondaryPositions} color="red" weight={3} />
//       )}

//       {/* route_points: 緑→黒のグラデーション */}
//       {positions && positions.length > 0 && (
//         <GradientPolyline positions={positions as [number, number][]} />
//       )}

//       {/* ゴールマーカー */}
//       {goalPosition && <Marker position={goalPosition} icon={goalIcon} />}

//       {/* スタートマーカー */}
//       {startPosition && <Marker position={startPosition} icon={startIcon} />}

//       <FitBounds
//         positions={positions}
//         secondaryPositions={secondaryPositions}
//         padding={padding}
//         maxZoom={maxZoom}
//         isDrawingMode={isDrawingMode} // ★ 渡す
//       />
//     </MapContainer>
//   );
// };

// export default RouteMap;

"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, LatLngBounds } from "leaflet";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { startIcon, goalIcon } from "./MapIcons";

const GradientPolyline = dynamic(
  () => import("./MapComponents").then((mod) => mod.GradientPolyline),
  { ssr: false }
);

type CSSSize = number | string;

interface RouteMapProps {
  positions?: LatLngExpression[];         // 青い線（route_points）
  secondaryPositions?: LatLngExpression[]; // 赤い線（drawing_points）
  height?: CSSSize;
  width?: CSSSize;
  padding?: number;
  maxZoom?: number;
  interactive?: boolean; // 初期化用のフラグ（後からは LockInteractions で制御）
  showZoomControl?: boolean;
  /** 描画モード：true の間は fitBounds 無効 & 地図操作を完全ロック */
  isDrawingMode?: boolean;
}

const FitBounds = ({
  positions,
  secondaryPositions,
  padding = 5,
  maxZoom = 16,
  isDrawingMode = false,
}: {
  positions?: LatLngExpression[];
  secondaryPositions?: LatLngExpression[];
  padding?: number;
  maxZoom?: number;
  isDrawingMode?: boolean;
}) => {
  const map = useMap();

  useEffect(() => {
    // 描画モード中は視点を動かさない
    if (isDrawingMode) return;

    const all = [...(positions || []), ...(secondaryPositions || [])];
    if (all.length === 0) return;
    const bounds = new LatLngBounds(all);
    map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
  }, [positions, secondaryPositions, padding, maxZoom, map, isDrawingMode]);

  return null;
};

// ★ 追加：描画モード中に Leaflet の各操作を明示的に disable/enable
function LockInteractions({ lock }: { lock: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const methods = [
      "dragging",
      "scrollWheelZoom",
      "doubleClickZoom",
      "touchZoom",
      "boxZoom",
      "keyboard",
    ] as const;

    if (lock) {
      methods.forEach((m) => (map as any)[m]?.disable?.());
      // モバイルのブラウザ既定ジェスチャ（ピンチズーム等）も抑止
      map.getContainer().style.touchAction = "none";
    } else {
      methods.forEach((m) => (map as any)[m]?.enable?.());
      map.getContainer().style.touchAction = "";
    }
  }, [map, lock]);

  return null;
}

export default function RouteMap({
  positions,
  secondaryPositions,
  height = 400,
  width = "100%",
  padding = 5,
  maxZoom = 16,
  interactive = true,
  showZoomControl = true,
  isDrawingMode = false,
}: RouteMapProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const w = typeof width === "number" ? `${width}px` : width;

  const startPosition = positions?.[0] || secondaryPositions?.[0];
  const goalPosition =
    positions && positions.length > 1 ? positions[positions.length - 1] : null;

  return (
    <MapContainer
      style={{ height: h, width: w }}
      attributionControl={false}
      zoomControl={showZoomControl && !isDrawingMode} // 描画中はズーム UI も隠す
      // 初期化時の設定（切替は LockInteractions が担当）
      dragging={interactive && !isDrawingMode}
      touchZoom={interactive && !isDrawingMode}
      doubleClickZoom={interactive && !isDrawingMode}
      scrollWheelZoom={interactive && !isDrawingMode}
      boxZoom={interactive && !isDrawingMode}
      keyboard={interactive && !isDrawingMode}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

      {/* drawing_points: 赤 */}
      {secondaryPositions && secondaryPositions.length > 0 && (
        <Polyline positions={secondaryPositions} color="red" weight={3} />
      )}

      {/* route_points: 緑→黒グラデーション */}
      {positions && positions.length > 0 && (
        <GradientPolyline positions={positions as [number, number][]} />
      )}

      {/* マーカー */}
      {goalPosition && <Marker position={goalPosition} icon={goalIcon} />}
      {startPosition && <Marker position={startPosition} icon={startIcon} />}

      <FitBounds
        positions={positions}
        secondaryPositions={secondaryPositions}
        padding={padding}
        maxZoom={maxZoom}
        isDrawingMode={isDrawingMode}
      />

      {/* ★ 描画モード時に地図操作を完全ロック */}
      <LockInteractions lock={isDrawingMode} />
    </MapContainer>
  );
}
