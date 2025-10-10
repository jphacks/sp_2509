"use client";

import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";

interface MapProps {
  positions: LatLngExpression[];
}

const Map = ({ positions }: MapProps) => {
  if (!positions || positions.length === 0) {
    return <div>位置情報がありません。</div>;
  }
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
      <Polyline positions={positions} color="blue" />
    </MapContainer>
  );
};

export default Map;