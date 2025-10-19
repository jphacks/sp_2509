"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon, LatLngBounds } from "leaflet";
import { useEffect } from "react";

type CSSSize = number | string;

interface RouteMapProps {
  /** route_points用の座標（青い線） */
  positions?: LatLngExpression[];
  /** drawing_points用の座標（赤い線） */
  secondaryPositions?: LatLngExpression[];
  /** 実コンテナの高さ（fitBoundsのズーム決定に影響） */
  height?: CSSSize;
  /** 実コンテナの幅（fitBoundsのズーム決定に影響） */
  width?: CSSSize;
  /** fitBoundsの余白(px)。大きいほど引き気味 */
  padding?: number;
  /** 近づきすぎ防止の上限ズーム */
  maxZoom?: number;
  /** 地図の操作（ズーム・ドラッグ）を許可するか */
  interactive?: boolean; // default: true
  /** ズームコントロールボタンを表示するか */
  showZoomControl?: boolean; // default: true
}

const FitBounds = ({
  positions,
  secondaryPositions,
  padding = 5,
  maxZoom = 16,
}: {
  positions?: LatLngExpression[];
  secondaryPositions?: LatLngExpression[];
  padding?: number;
  maxZoom?: number;
}) => {
  const map = useMap();

  useEffect(() => {
    const allPositions = [...(positions || []), ...(secondaryPositions || [])];
    if (allPositions.length === 0) return;
    const bounds = new LatLngBounds(allPositions);
    map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
  }, [positions, secondaryPositions, padding, maxZoom, map]);

  return null;
};

const RouteMap = ({
  positions,
  secondaryPositions,
  height = 400,
  width = "100%",
  padding = 5,
  maxZoom = 16,
  interactive = true,
  showZoomControl = true,
}: RouteMapProps) => {
  const h = typeof height === "number" ? `${height}px` : height;
  const w = typeof width === "number" ? `${width}px` : width;

  const startIcon = divIcon({
    html: `<div style="background-color:#4A90E2;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;">S</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  // スタート位置は positions または secondaryPositions の最初
  const startPosition = positions?.[0] || secondaryPositions?.[0];

  return (
    <MapContainer
      style={{ height: h, width: w }}
      attributionControl={false}
      zoomControl={showZoomControl}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      scrollWheelZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* drawing_points: 赤い線 */}
      {secondaryPositions && secondaryPositions.length > 0 && (
        <Polyline positions={secondaryPositions} color="red" weight={3} />
      )}
      
      {/* route_points: 青い線 */}
      {positions && positions.length > 0 && (
        <Polyline positions={positions} color="blue" weight={3} />
      )}

      

      {/* スタートマーカー */}
      {startPosition && <Marker position={startPosition} icon={startIcon} />}

      <FitBounds
        positions={positions}
        secondaryPositions={secondaryPositions}
        padding={padding}
        maxZoom={maxZoom}
      />
    </MapContainer>
  );
};

export default RouteMap;
