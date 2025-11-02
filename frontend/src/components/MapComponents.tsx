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

      // Start color (Green: #20B950)
      const startR = 32, startG = 185, startB = 80;
      // End color (Gray: #222222)
      const endR = 34, endG = 34, endB = 34;

      const r = Math.round(startR + (endR - startR) * ratio);
      const g = Math.round(startG + (endG - startG) * ratio);
      const b = Math.round(startB + (endB - startB) * ratio);
      const darkColor = `rgb(${r}, ${g}, ${b})`;

      const borderPolyline = L.polyline(segmentPositions, {
        color: darkColor,
        weight: 11,
        opacity: 1, // 不透明に固定
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

      // Start color (Brighter Green)
      const startR_light = 82, startG_light = 235, startB_light = 130;
      // End color (Brighter Gray)
      const endR_light = 88, endG_light = 88, endB_light = 88;

      const r_light = Math.round(startR_light + (endR_light - startR_light) * ratio);
      const g_light = Math.round(startG_light + (endG_light - startG_light) * ratio);
      const b_light = Math.round(startB_light + (endB_light - startB_light) * ratio);
      const lightColor = `rgb(${r_light}, ${g_light}, ${b_light})`;

      const innerPolyline = L.polyline(segmentPositions, {
        color: lightColor,
        weight: 7,
        opacity: 1, // 不透明に固定
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

// 点線を描画するコンポーネント
export function DashedPolyline({ 
  positions, 
  color = "#f59e0b", 
  weight = 3,
  dashArray = "10, 10"
}: { 
  positions: [number, number][]; 
  color?: string;
  weight?: number;
  dashArray?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    const dashedLine = L.polyline(positions, {
      color: color,
      weight: weight,
      opacity: 1,
      dashArray: dashArray,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    return () => {
      map.removeLayer(dashedLine);
    };
  }, [map, positions, color, weight, dashArray]);

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
