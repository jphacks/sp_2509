"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon, LatLngBounds } from "leaflet";
import { useEffect } from "react";

type CSSSize = number | string; // numberはpx、stringは"100%"など

interface RouteMapProps {
  positions?: LatLngExpression[];
  drawnLine?: LatLngExpression[];
  /** 実コンテナの高さ（fitBoundsのズーム決定に影響） */
  height?: CSSSize;      // default: 400
  /** 実コンテナの幅（fitBoundsのズーム決定に影響） */
  width?: CSSSize;       // default: "100%"
  /** fitBoundsの余白(px)。大きいほど引き気味 */
  padding?: number;      // default: 5
  /** 近づきすぎ防止の上限ズーム */
  maxZoom?: number;      // default: 16
  /** 地図の操作（ズーム・ドラッグ）を許可するか */
  interactive?: boolean; // default: true
  /** ズームコントロールボタンを表示するか */
  showZoomControl?: boolean; // default: true
}

const FitBounds = ({
  positions,
  padding = 5,
  maxZoom = 16,
}: {
  positions?: LatLngExpression[];
  padding?: number;
  maxZoom?: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const bounds = new LatLngBounds(positions);
    map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
  }, [positions, padding, maxZoom, map]);

  return null;
};

const RouteMap = ({
  positions,
  drawnLine,
  height = 400,
  width = "100%",
  padding = 5,
  maxZoom = 16,
  interactive = true,
  showZoomControl = true,
}: RouteMapProps) => {
  const h = typeof height === "number" ? `${height}px` : height;
  const w = typeof width === "number" ? `${width}px` : width;

  // "S" のカスタムスタートピン
  const startIcon = divIcon({
    html: `<div style="background-color:#4A90E2;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;">S</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return (
    <MapContainer
      style={{ height: h, width: w }}
      attributionControl={false}
      zoomControl={showZoomControl} // ここを修正
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

      {positions && positions.length > 0 && (
        <>
          <Polyline positions={positions} color="red" />
          <Marker position={positions[0]} icon={startIcon} />
        </>
      )}

      {/* 指で書いた線 (青い点線) */}
      {drawnLine && drawnLine.length > 0 && (
        <Polyline positions={drawnLine} color="blue" dashArray="5, 10" />
      )}

      <FitBounds positions={positions} padding={padding} maxZoom={maxZoom} />
    </MapContainer>
  );
};

export default RouteMap;
