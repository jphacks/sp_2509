"use client";

import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import { FaPencilAlt, FaCog, FaSave } from "react-icons/fa";

export default function CourseDetailPage() {
  const routePositionsTokyo: [number, number][] = [
    [35.6895, 139.6917], // 新宿
    [35.6812, 139.7671], // 東京駅
    [35.6586, 139.7454], // 東京タワー
  ];

  const drawingPositionsTokyo: [number, number][] = [
    [35.6895, 139.6917], // 新宿
    [35.685, 139.71], // 中間地点1
    [35.68, 139.73], // 中間地点2
    [35.6812, 139.7671], // 東京駅
    [35.675, 139.75], // 中間地点3
    [35.6586, 139.7454], // 東京タワー
  ];

  // routeData 形式に変換
  const routeData = {
    total_distance_km: 10,
    route_points: routePositionsTokyo.map(([lat, lng]) => ({ lat, lng })),
    drawing_points: drawingPositionsTokyo.map(([lat, lng]) => ({ lat, lng })),
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-md mx-auto p-4">
        <div className="text-left mb-6">
          <Title title="コース詳細" />
        </div>

        <div className="px-4">
          <MadeRouteCard_Big routeData={routeData} />
        </div>

        <div className="px-4 mt-6 space-y-4">
          <RoutingButton
            buttonText="描きなおす"
            to="/draw"
            icon={FaPencilAlt}
          />
          <RoutingButton buttonText="条件変更" to="/condition" icon={FaCog} />
          <RoutingButton
            buttonText="保存してホームに戻る"
            to="/home"
            icon={FaSave}
          />
        </div>
      </main>
    </div>
  );
}
