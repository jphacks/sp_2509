"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngBounds, type LatLngExpression } from "leaflet";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { startIcon, goalIcon } from "./MapIcons";
import MapDrawingHandler from "./MapDrawingHandler";

const GradientPolyline = dynamic(
  () => import("./MapComponents").then((mod) => mod.GradientPolyline),
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
  /** 初回だけ fitBounds する（通常時はズームを維持） */
  fitOnMountOnly?: boolean;
  /** ★ 追加：この値が変わったら「初期fitBounds」を再実行 */
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

    // 初回のみ or リセットシグナル時だけ fitBounds
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

function LockInteractions({ lock }: { lock: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
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
      container.style.cursor = "crosshair";
    } else {
      methods.forEach((m) => (map as any)[m]?.enable?.());
      container.style.touchAction = "";
      container.style.cursor = "";
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
  onDrawOnMap,
  fitOnMountOnly = false,
  resetViewSignal,
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
      zoomControl={showZoomControl && !isDrawingMode}
      dragging={interactive && !isDrawingMode}
      touchZoom={interactive && !isDrawingMode}
      doubleClickZoom={interactive && !isDrawingMode}
      scrollWheelZoom={interactive && !isDrawingMode}
      boxZoom={interactive && !isDrawingMode}
      keyboard={interactive && !isDrawingMode}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

      {secondaryPositions && secondaryPositions.length > 0 && (
        <Polyline positions={secondaryPositions} color="red" weight={3} />
      )}

      {positions && positions.length > 0 && (
        <GradientPolyline positions={positions as [number, number][]} />
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

      <LockInteractions lock={isDrawingMode} />

      {onDrawOnMap && (
        <MapDrawingHandler isDrawingMode={isDrawingMode} onDrawEnd={onDrawOnMap} />
      )}
    </MapContainer>
  );
}
