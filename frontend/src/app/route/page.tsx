"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import { FaPencilAlt, FaCog, FaSave } from "react-icons/fa";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import RecalculationButton from "@/components/ReCalculationButton";
import Loading from "@/components/Loading";
import type { Point } from "@/types/types";
import UndoButton from "@/components/UndoButton";
import CancelEditButton from "@/components/CancelEditButton";

// RouteMapWithPointsを動的にインポート
const RouteMapWithPoints = dynamic(() => import("../../components/RouteMapWithPoints"), {
  ssr: false,
});

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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [updatedDrawingPoints, setUpdatedDrawingPoints] = useState<RoutePoint[]>([]);
  const [updatedRoutePoints, setUpdatedRoutePoints] = useState<RoutePoint[]>([]);
  const [originalDrawingXY, setOriginalDrawingXY] = useState<Point[]>([]);

  // Undo/Cancel用のState
  const [history, setHistory] = useState<RoutePoint[][]>([]);
  const [originalPointsBeforeEdit, setOriginalPointsBeforeEdit] = useState<RoutePoint[]>([]);

  useEffect(() => {
    const responsePointsDataStr = localStorage.getItem("responsePointsData");
    const originalDrawingXYStr = localStorage.getItem("drawingPointsData");

    if (responsePointsDataStr && originalDrawingXYStr) {
      try {
        const parsedResponseData: ResponseData = JSON.parse(responsePointsDataStr);
        const parsedOriginalXY: Point[] = JSON.parse(originalDrawingXYStr);

        setRouteData(parsedResponseData);
        setUpdatedRoutePoints(parsedResponseData.route_points);
        setUpdatedDrawingPoints(parsedResponseData.drawing_points);
        setOriginalDrawingXY(parsedOriginalXY);

      } catch (error) {
        console.error("ローカルストレージのデータ解析に失敗しました:", error);
        alert("コースデータの読み込みに失敗しました。");
        router.push("/home");
      }
    } else {
      alert("表示するコースデータが見つかりません。");
      router.push("/home");
    }
  }, [router]);

  const handleRecalculate = async () => {
    if (isRecalculating || updatedRoutePoints.length === 0) return;
    setIsRecalculating(true);

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    updatedRoutePoints.forEach(p => {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    });

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const maxRange = Math.max(latRange, lngRange);
    const CANVAS_SIZE = 400;

    const newDisplayPoints = updatedRoutePoints.map(p => {
      const x = lngRange > 0 ? ((p.lng - minLng) / maxRange) * CANVAS_SIZE : CANVAS_SIZE / 2;
      const y = latRange > 0 ? ((maxLat - p.lat) / maxRange) * CANVAS_SIZE : CANVAS_SIZE / 2;
      return { x, y };
    });

    const payload = {
      drawing_display_points: newDisplayPoints,
      start_location: updatedRoutePoints[0],
      target_distance_km: routeData?.total_distance_km || 10,
    };

    try {
      const res = await fetch(`${API_URL}/routes/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newData: ResponseData = await res.json();
        setRouteData(newData);
        setUpdatedRoutePoints(newData.route_points);
        setUpdatedDrawingPoints(newData.drawing_points);
        localStorage.setItem("responsePointsData", JSON.stringify(newData));
      } else {
        const errorData = await res.json();
        alert(`再計算に失敗しました: ${errorData.detail || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("再計算APIエラー:", error);
      alert("再計算中にエラーが発生しました");
    } finally {
      setIsRecalculating(false);
      setIsEditing(false);
      setHistory([]); // 再計算後は履歴をクリア
    }
  };

  const handleSaveCourse = async () => {
    if (!routeData || isSaving) return;
    setIsSaving(true);
    try {
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
          route_points: updatedRoutePoints,
          drawing_points: updatedDrawingPoints,
          is_favorite: false,
        }),
      });
      if (response.ok) {
        localStorage.removeItem("responsePointsData");
        localStorage.removeItem("drawingPointsData");
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

  const handlePointsChange = (newPositions: LatLngExpression[]) => {
    const newRoutePoints: RoutePoint[] = newPositions.map(pos => {
      if (Array.isArray(pos)) {
        return { lat: pos[0], lng: pos[1] };
      }
      return pos as RoutePoint;
    });
    setUpdatedDrawingPoints(newRoutePoints);
  };

  const handlePrimaryPointsChange = (newPositions: LatLngExpression[]) => {
    const newRoutePoints: RoutePoint[] = newPositions.map(pos => {
      if (Array.isArray(pos)) {
        return { lat: pos[0], lng: pos[1] };
      }
      return pos as RoutePoint;
    });
    setHistory(prev => [...prev, updatedRoutePoints]);
    setUpdatedRoutePoints(newRoutePoints);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousPoints = history[history.length - 1];
    setUpdatedRoutePoints(previousPoints);
    setHistory(prev => prev.slice(0, prev.length - 1));
  };

  const handleEnterEditMode = () => {
    setOriginalPointsBeforeEdit(updatedRoutePoints);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setUpdatedRoutePoints(originalPointsBeforeEdit);
    setIsEditing(false);
    setHistory([]);
  };

  const loadingAnimationPoints = useMemo(() => {
    if (updatedRoutePoints.length === 0) {
      return originalDrawingXY;
    }

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    updatedRoutePoints.forEach(p => {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    });

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const maxRange = Math.max(latRange, lngRange);
    const CANVAS_SIZE = 400;

    return updatedRoutePoints.map(p => {
      const x = lngRange > 0 ? ((p.lng - minLng) / maxRange) * CANVAS_SIZE : CANVAS_SIZE / 2;
      const y = latRange > 0 ? ((maxLat - p.lat) / maxRange) * CANVAS_SIZE : CANVAS_SIZE / 2;
      return { x, y };
    });
  }, [updatedRoutePoints, originalDrawingXY]);

  if (!routeData || isRecalculating) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-8">
        <Loading
          loadingText={isRecalculating ? "コースを再計算中…" : "データを読み込み中..."}
          points={isRecalculating ? loadingAnimationPoints : originalDrawingXY}
          size={120}
        />
        {isRecalculating && (
          <div className="mt-2 text-sm text-gray-500">
            <p>この処理は30秒程度かかる可能性があります。</p>
          </div>
        )}
      </div>
    );
  }

  const routePositions: LatLngExpression[] = updatedRoutePoints.map(p => [p.lat, p.lng]);
  const drawingPositions: LatLngExpression[] = updatedDrawingPoints.map(p => [p.lat, p.lng]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-md mx-auto p-4">
        <div className="text-left mb-6 font-sans">
          <Title title="コースが完成しました" />
        </div>

        <div className="px-4 rounded-3xl overflow-hidden shadow-md">
          <RouteMapWithPoints
            positions={routePositions}
            secondaryPositions={drawingPositions}
            onPointsChange={handlePointsChange}
            onPrimaryPointsChange={handlePrimaryPointsChange}
            height={300}
            isEditable={isEditing}
          />
        </div>

        <div className="px-4 pt-4 text-left">
          <div className="flex justify-between items-baseline">
            <div className="text-[15px] text-neutral-600">コース距離</div>
            <div className="text-[22px] font-extrabold leading-tight">
              {routeData.total_distance_km.toFixed(1)}km
            </div>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-4">
          {isEditing ? (
            <>
              <div className="flex gap-2">
                <UndoButton onClick={handleUndo} disabled={history.length === 0} />
                <CancelEditButton onClick={handleCancelEdit} />
              </div>
              <RecalculationButton
                onClick={handleRecalculate}
                disabled={isRecalculating}
              >
                再計算して完了
              </RecalculationButton>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <RoutingButton buttonText="条件変更" to="/condition" icon={FaCog} />
                <RoutingButton
                  buttonText="描きなおす"
                  to="/draw"
                  icon={FaPencilAlt}
                />
              </div>

              <RecalculationButton
                onClick={handleEnterEditMode}
                disabled={isRecalculating}
              >
                コースを編集
              </RecalculationButton>

              <button
                onClick={handleSaveCourse}
                disabled={isSaving || isRecalculating}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 text-lg font-semibold tracking-wide rounded-2xl shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-out select-none font-sans"
              >
                <FaSave size={22} />
                <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}