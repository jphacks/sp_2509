"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon, LatLngBounds } from "leaflet";
import { useEffect } from "react";

interface RouteMapProps {
  positions?: LatLngExpression[];
  drawnLine?: LatLngExpression[];
}

const FitBounds = ({ positions }: { positions?: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = new LatLngBounds(positions);
      map.fitBounds(bounds, { padding: [5, 5] });
    }
  }, [positions, map]);

  return null;
};

const RouteMap = ({ positions, drawnLine }: RouteMapProps) => {
  // "S"の文字を持つカスタムスタートピンを作成
  const startIcon = divIcon({
    html: `<div style="background-color: #4A90E2; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">S</div>`,
    className: "", // leaflet-div-iconのデフォルトスタイルを無効化
    iconSize: [30, 30],
    iconAnchor: [15, 15], // アイコンの中心がマーカー位置になるように調整
  });

  return (
    <MapContainer
      style={{ height: "400px", width: "100%" }}
      zoomControl={false}
    // centerとzoomはFitBoundsコンポーネントが動的に設定するため、削除しました。
    // 初期表示位置が必要な場合は、positionsが空の時のためのデフォルトboundsを設定するなどの工夫が必要です。
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {positions && positions.length > 0 && (
        <div>
          <Polyline positions={positions} color="red" />
          <Marker position={positions[0]} icon={startIcon} />
        </div>
      )}

      {/* 指で書いた線 (青い点線) */}
      {drawnLine && drawnLine.length > 0 && (
        <Polyline positions={drawnLine} color="blue" dashArray="5, 10" />
      )}
      <FitBounds positions={positions} />
    </MapContainer>
  );
};

export default RouteMap;
