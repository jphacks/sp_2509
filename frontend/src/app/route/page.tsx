"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import { FaPencilAlt, FaCog, FaSave } from "react-icons/fa";

const API_URL = "/api";

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
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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

  const handleSaveCourse = async () => {
    if (!routeData || isSaving) return;

    setIsSaving(true);

    try {
      // ユーザーIDをローカルストレージから取得
      // 実際の実装に合わせてユーザーIDの取得方法を調整してください
      const userId = localStorage.getItem("uuid");
      if (!userId) {
        alert("ユーザー情報が見つかりません");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/${userId}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_distance_km: routeData.total_distance_km,
          route_points: routeData.route_points,
          drawing_points: routeData.drawing_points,
          is_favorite: false,
        }),
      });

      if (response.ok) {
        // 保存成功後、ローカルストレージをクリア
        localStorage.removeItem("responsePointsData");
        localStorage.removeItem("drawingPointsData");

        // ホーム画面に遷移
        router.push("/home");
      } else {
        const errorData = await response.json();
        alert(`保存に失敗しました: ${errorData.detail || "不明なエラー"}`);
        setIsSaving(false);
      }
    } catch (error) {
      console.error("コース保存エラー:", error);
      alert("保存中にエラーが発生しました");
      setIsSaving(false);
    }
  };

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
        <div className="text-left mb-6 font-sans">
          <Title title="コースが完成しました" />
        </div>

        <div className="px-4">
          <MadeRouteCard_Big routeData={routeData} />
        </div>

        <div className="px-4 mt-6 space-y-4">
          <div className="flex gap-2">
            <RoutingButton buttonText="条件変更" to="/condition" icon={FaCog} />

            <RoutingButton
              buttonText="描きなおす"
              to="/draw"
              icon={FaPencilAlt}
            />
          </div>
          <button
            onClick={handleSaveCourse}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 text-lg font-semibold tracking-wide rounded-2xl shadow-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-out select-none font-sans"
          >
            <FaSave size={22} />
            <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
