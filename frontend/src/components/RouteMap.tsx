"use client";

import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon } from "leaflet";

interface RouteMapProps {
  positions?: LatLngExpression[];
  drawnLine?: LatLngExpression[];
}

const RouteMap = ({ positions, drawnLine }: RouteMapProps) => {
  if (!positions || positions.length === 0) {
    return <div>位置情報がありません。</div>;
  }

    // "S"の文字を持つカスタムスタートピンを作成
  const startIcon = divIcon({
    html: `<div style="background-color: #4A90E2; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">S</div>`,
    className: "", // leaflet-div-iconのデフォルトスタイルを無効化
    iconSize: [30, 30],
    iconAnchor: [15, 15], // アイコンの中心がマーカー位置になるように調整
  });

  return (
    <MapContainer
      center={positions[0]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {positions && positions.length > 0 &&(
        <div>
          <Polyline positions={positions} color="red" />
          <Marker position={positions[0]} icon={startIcon} />
        </div>
      )}

      {/* 指で書いた線 (赤い点線) */}
      {drawnLine && drawnLine.length > 0 && (
        <Polyline positions={drawnLine} color="blue" dashArray="5, 10" />
      )}


    </MapContainer>
  );
};

export default RouteMap;