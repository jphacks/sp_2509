// frontend/src/components/RouteMap.tsx
"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// ★ 修正: LatLngBounds と LatLngExpression を型としてインポート
import { LatLngBounds, type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { startIcon, goalIcon } from "./MapIcons";
// ★ 新しくインポート
import MapDrawingHandler from "./MapDrawingHandler";

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
  /** ★ 新しい prop: 描画完了時にLatLngの配列を返す */
  onDrawOnMap?: (points: LatLngExpression[]) => void;
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

// ★ 修正: LockInteractions にカーソル変更機能を追加
function LockInteractions({ lock }: { lock: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer(); // ★ mapコンテナを取得

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
      container.style.touchAction = "none";
      container.style.cursor = "crosshair"; // ★ 描画モードのカーソル
    } else {
      methods.forEach((m) => (map as any)[m]?.enable?.());
      container.style.touchAction = "";
      container.style.cursor = ""; // ★ 通常のカーソル
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
  onDrawOnMap, // ★ prop を受け取る
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

      {/* ★ 新しい描画ハンドラーを追加 */}
      {onDrawOnMap && (
        <MapDrawingHandler
          isDrawingMode={isDrawingMode}
          onDrawEnd={onDrawOnMap}
        />
      )}
    </MapContainer>
  );
}