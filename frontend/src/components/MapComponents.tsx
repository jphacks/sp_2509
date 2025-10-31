import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// グラデーション付きPolylineを描画するコンポーネント
export function GradientPolyline({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    const segments: L.Polyline[] = [];
    const segmentCount = Math.min(positions.length - 1, 20);

    for (let i = segmentCount - 1; i >= 0; i--) {
      const startIndex = Math.floor((i * (positions.length - 1)) / segmentCount);
      const endIndex = Math.floor(((i + 1) * (positions.length - 1)) / segmentCount);
      if (startIndex === endIndex) continue;
      const segmentPositions = positions.slice(startIndex, endIndex + 1);

      const ratio = i / (segmentCount - 1);
      const red = Math.round(32 * (1 - ratio));
      const green = Math.round(185 * (1 - ratio));
      const blue = Math.round(80 * (1 - ratio));
      const darkColor = `rgb(${red}, ${green}, ${blue})`;
      const opacity = 1 - ratio * 0.5;

      const borderPolyline = L.polyline(segmentPositions, {
        color: darkColor,
        weight: 11,
        opacity: opacity,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      segments.push(borderPolyline);
    }

    for (let i = segmentCount - 1; i >= 0; i--) {
      const startIndex = Math.floor((i * (positions.length - 1)) / segmentCount);
      const endIndex = Math.floor(((i + 1) * (positions.length - 1)) / segmentCount);
      if (startIndex === endIndex) continue;
      const segmentPositions = positions.slice(startIndex, endIndex + 1);

      const ratio = i / (segmentCount - 1);
      const red = Math.round(32 * (1 - ratio));
      const green = Math.round(185 * (1 - ratio));
      const blue = Math.round(80 * (1 - ratio));
      const opacity = 1 - ratio * 0.5;

      const brighterRed = Math.min(255, red + 50);
      const brighterGreen = Math.min(255, green + 50);
      const brighterBlue = Math.min(255, blue + 50);
      const lightColor = `rgb(${brighterRed}, ${brighterGreen}, ${brighterBlue})`;

      const innerPolyline = L.polyline(segmentPositions, {
        color: lightColor,
        weight: 7,
        opacity: opacity,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      segments.push(innerPolyline);
    }

    return () => {
      segments.forEach(segment => {
        map.removeLayer(segment);
      });
    };
  }, [map, positions]);

  return null;
}

// 現在位置を追跡してマップを更新するコンポーネント
export function LocationTracker({ currentPosition, energySaveMode, isFollowing }: {
  currentPosition: [number, number] | null;
  energySaveMode: boolean;
  isFollowing: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (currentPosition && !energySaveMode && isFollowing) {
      map.setView(currentPosition, map.getZoom(), { animate: true });
    }
  }, [currentPosition, map, energySaveMode, isFollowing]);

  return null;
}
