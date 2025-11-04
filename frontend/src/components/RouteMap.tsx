"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngBounds, type LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { startIcon, goalIcon } from "./MapIcons";
import MapDrawingHandler from "./MapDrawingHandler";
import { ACCENT_AMBER } from "../lib/color";

const GradientPolyline = dynamic(
  () => import("./MapComponents").then((mod) => mod.GradientPolyline),
  { ssr: false }
);
const DashedPolyline = dynamic(
  () => import("./MapComponents").then((mod) => mod.DashedPolyline),
  { ssr: false }
);

type CSSSize = number | string;

interface RouteMapProps {
  positions?: LatLngExpression[];
  secondaryPositions?: LatLngExpression[];
  height?: CSSSize;
  width?: CSSSize;
  padding?: number;
  maxZoom?: number;
  interactive?: boolean;
  showZoomControl?: boolean;
  isDrawingMode?: boolean;
  onDrawOnMap?: (points: LatLngExpression[]) => void;
  fitOnMountOnly?: boolean;
  resetViewSignal?: number;
}

const FitBounds = ({
  positions,
  secondaryPositions,
  padding = 5,
  maxZoom = 16,
  isDrawingMode = false,
  fitOnMountOnly = false,
  resetViewSignal,
}: {
  positions?: LatLngExpression[];
  secondaryPositions?: LatLngExpression[];
  padding?: number;
  maxZoom?: number;
  isDrawingMode?: boolean;
  fitOnMountOnly?: boolean;
  resetViewSignal?: number;
}) => {
  const map = useMap();
  const didFitOnce = useRef(false);
  const lastReset = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isDrawingMode) return;

    const resetChanged =
      resetViewSignal !== undefined && resetViewSignal !== lastReset.current;

    if (fitOnMountOnly && didFitOnce.current && !resetChanged) return;

    const all = [...(positions || []), ...(secondaryPositions || [])];
    if (all.length === 0) return;

    const bounds = new LatLngBounds(all);
    map.fitBounds(bounds, { padding: [padding, padding], maxZoom });

    if (fitOnMountOnly) didFitOnce.current = true;
    if (resetChanged) lastReset.current = resetViewSignal;
  }, [
    positions,
    secondaryPositions,
    padding,
    maxZoom,
    map,
    isDrawingMode,
    fitOnMountOnly,
    resetViewSignal,
  ]);

  return null;
};

/** 描画状態とタッチ本数に応じて Leaflet 動作と CSS を切り替えるコンポーネント */
function InteractionPolicy({
  enabled,
  drawing,
  touchCount,
}: {
  enabled: boolean;
  drawing: boolean;
  touchCount: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const c = map.getContainer();

    if (!enabled) {
      (map as any).dragging?.enable?.();
      (map as any).touchZoom?.enable?.();
      (map as any).scrollWheelZoom?.enable?.();
      (map as any).doubleClickZoom?.enable?.();
      (map as any).boxZoom?.enable?.();
      (map as any).keyboard?.enable?.();
      c.style.touchAction = "";
      c.style.cursor = "";
      return;
    }

    // 描画モード中はホイール/ダブルクリック等の誤操作を無効化
    (map as any).scrollWheelZoom?.disable?.();
    (map as any).doubleClickZoom?.disable?.();
    (map as any).boxZoom?.disable?.();
    (map as any).keyboard?.disable?.();

    if (drawing && touchCount <= 1) {
      (map as any).dragging?.disable?.();
      (map as any).touchZoom?.disable?.();
      c.style.touchAction = "none";
      c.style.cursor = "crosshair";
    } else {
      (map as any).dragging?.enable?.();
      (map as any).touchZoom?.enable?.();
      c.style.touchAction = "pinch-zoom pan-x pan-y";
      c.style.cursor = drawing ? "crosshair" : "";
    }
  }, [map, enabled, drawing, touchCount]);

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
  onDrawOnMap,
  fitOnMountOnly = false,
  resetViewSignal,
}: RouteMapProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const w = typeof width === "number" ? `${width}px` : width;

  const startPosition = positions?.[0] || secondaryPositions?.[0];
  const goalPosition =
    positions && positions.length > 1 ? positions[positions.length - 1] : null;

  const [drawingState, setDrawingState] = useState({ drawing: false, touchCount: 0 });

  return (
    <MapContainer
      style={{ height: h, width: w }}
      attributionControl={false}
      zoomControl={showZoomControl && !isDrawingMode}
      // ベースは常に有効化しておき、InteractionPolicy コンポーネント側で動的に切替
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive && !isDrawingMode}
      scrollWheelZoom={interactive && !isDrawingMode}
      boxZoom={interactive && !isDrawingMode}
      keyboard={interactive && !isDrawingMode}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

      {positions && positions.length > 0 && (
        <GradientPolyline positions={positions as [number, number][]} />
      )}

      {secondaryPositions && secondaryPositions.length > 0 && (
        <DashedPolyline
          positions={secondaryPositions as [number, number][]}
          color={ACCENT_AMBER}
          weight={2}
          dashArray="10, 5"
        />
      )}

      {goalPosition && <Marker position={goalPosition} icon={goalIcon} />}
      {startPosition && <Marker position={startPosition} icon={startIcon} />}

      <FitBounds
        positions={positions}
        secondaryPositions={secondaryPositions}
        padding={padding}
        maxZoom={maxZoom}
        isDrawingMode={isDrawingMode}
        fitOnMountOnly={fitOnMountOnly}
        resetViewSignal={resetViewSignal}
      />

      <InteractionPolicy
        enabled={!!isDrawingMode}
        drawing={drawingState.drawing}
        touchCount={drawingState.touchCount}
      />

      {onDrawOnMap && (
        <MapDrawingHandler
          isDrawingMode={isDrawingMode}
          onDrawEnd={onDrawOnMap}
          onDrawingStateChange={setDrawingState}
        />
      )}
    </MapContainer>
  );
}
