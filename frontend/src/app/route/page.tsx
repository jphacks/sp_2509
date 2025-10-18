"use client";

import { useEffect, useState } from "react";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import { FaPencilAlt, FaCog, FaSave } from "react-icons/fa";

type RoutePoint = {
  lat: number;
  lng: number;
};

type ResponseData = {
  total_distance_km: number;
  route_points: RoutePoint[];
  drawing_points: RoutePoint[];
};

export default function CourseDetailPage() {
  const [routeData, setRouteData] = useState<ResponseData | null>(null);

  useEffect(() => {
    // ローカルストレージからデータを取得
    const responsePointsData = localStorage.getItem("responsePointsData");
    const drawingPointsData = localStorage.getItem("drawingPointsData");

    if (responsePointsData) {
      try {
        const parsedData = JSON.parse(responsePointsData);

        // drawing_points がない場合は route_points をコピー
        const finalData: ResponseData = {
          total_distance_km: parsedData.total_distance_km || 0,
          route_points: parsedData.route_points || [],
          drawing_points:
            parsedData.drawing_points || parsedData.route_points || [],
        };

        setRouteData(finalData);
      } catch (error) {
        console.error("ローカルストレージのデータ解析に失敗しました:", error);
      }
    }
  }, []);

  if (!routeData) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-md mx-auto p-4">
          <div className="text-center py-8">
            <p className="text-gray-600">データを読み込んでいます...</p>
          </div>
        </main>
      </div>
    );
  }

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
