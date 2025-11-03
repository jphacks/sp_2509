// frontend/src/app/route/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import Text from "../../components/Text";
import {
  FaPencilAlt,
  FaSave,
  FaUndo,
  FaTimes,
  FaPaintBrush,
} from "react-icons/fa";
import EditButton from "@/components/EditButton";
import UndoButton from "@/components/UndoButton";
import CancelButton from "@/components/CancelButton";
import DrawButton from "@/components/DrawButton";
import BackButton from "@/components/BackButton";
import type { LatLngExpression, LatLng } from "leaflet";

const API_URL = "/api";

type RoutePoint = { lat: number; lng: number };

type ResponseData = {
  total_distance_km: number;
  route_points: RoutePoint[];
  drawing_points: RoutePoint[];
};

function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLon = (b.lng - a.lng) * (Math.PI / 180);
  const lat1 = a.lat * (Math.PI / 180);
  const lat2 = b.lat * (Math.PI / 180);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
function calculateTotalDistance(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) total += haversineKm(points[i], points[i + 1]);
  return parseFloat(total.toFixed(1));
}

/* --- アルゴリズム・ヘルパー --- */
const haversineM = (a: RoutePoint, b: RoutePoint) => haversineKm(a, b) * 1000;
function perpendicularDistanceM(p: RoutePoint, a: RoutePoint, b: RoutePoint): number {
  const segLen = haversineM(a, b);
  if (segLen === 0) return haversineM(p, a);
  const ax = a.lng, ay = a.lat, bx = b.lng, by = b.lat, px = p.lng, py = p.lat;
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (vx * wx + vy * wy) / (vx * vx + vy * vy)));
  const proj: RoutePoint = { lat: ay + t * vy, lng: ax + t * vx };
  return haversineM(p, proj);
}
function rdpSimplify(points: RoutePoint[], epsilonM = 10): RoutePoint[] {
  if (points.length <= 2) return points.slice();
  const first = points[0], last = points[points.length - 1];
  let idx = -1, maxDist = -1;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistanceM(points[i], first, last);
    if (d > maxDist) { maxDist = d; idx = i; }
  }
  if (maxDist > epsilonM) {
    const left = rdpSimplify(points.slice(0, idx + 1), epsilonM);
    const right = rdpSimplify(points.slice(idx), epsilonM);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}
function nearestVertexIndex(poly: RoutePoint[], target: RoutePoint) {
  let best = 0, bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < poly.length; i++) {
    const d = haversineM(poly[i], target);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return { index: best, distM: bestDist };
}

export default function CourseDetailPage() {
  const [routeData, setRouteData] = useState<ResponseData | null>(null);
  const [originalRouteData, setOriginalRouteData] = useState<ResponseData | null>(null);
  const [history, setHistory] = useState<ResponseData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapResetSeq, setMapResetSeq] = useState(0); // 地図リセット用
  const router = useRouter();

  useEffect(() => {
    const responsePointsData = localStorage.getItem("responsePointsData");
    if (!responsePointsData) return;
    try {
      const parsed = JSON.parse(responsePointsData);
      const finalData: ResponseData = {
        total_distance_km: parsed.total_distance_km || 0,
        route_points: parsed.route_points || [],
        drawing_points: parsed.drawing_points || parsed.route_points || [],
      };
      setRouteData(finalData);
      setOriginalRouteData(finalData);
      setHistory([finalData]);
    } catch (e) {
      console.error("ローカルストレージのデータ解析に失敗:", e);
    }
  }, []);

  const memoizedRouteData = useMemo(() => {
    if (!routeData) return null;
    return {
      total_distance_km: routeData.total_distance_km,
      route_points: routeData.route_points,
      drawing_points: routeData.drawing_points,
    };
  }, [routeData]);

  const handleSaveCourse = async () => {
    if (!routeData || isSaving) return;
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("uuid");
      if (!userId) {
        alert("ユーザー情報が見つかりません"); setIsSaving(false); return;
      }
      const res = await fetch(`${API_URL}/users/${userId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_distance_km: routeData.total_distance_km,
          route_points: routeData.route_points,
          drawing_points: routeData.drawing_points,
          is_favorite: false,
        }),
      });
      if (res.ok) {
        localStorage.removeItem("responsePointsData");
        localStorage.removeItem("drawingPointsData");
        router.push("/home");
      } else {
        const err = await res.json();
        alert(`保存に失敗しました: ${err.detail || "不明なエラー"}`);
        setIsSaving(false);
      }
    } catch (e) {
      console.error("保存中エラー:", e);
      alert("保存中にエラーが発生しました");
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // 編集完了：地図を初期縮尺へ戻す
      setMapResetSeq((n) => n + 1);
      setOriginalRouteData(routeData);
      setHistory([routeData!]);
    }
    setIsEditing(!isEditing);
    setIsDrawingMode(false);
  };

  const handleUndo = useCallback(() => {
    if (history.length > 1) {
      const newHist = [...history];
      newHist.pop();
      setRouteData(newHist[newHist.length - 1]);
      setHistory(newHist);
    }
  }, [history]);

  const handleCancelEdit = useCallback(() => {
    setRouteData(originalRouteData);
    setIsEditing(false);
    setIsDrawingMode(false);
  }, [originalRouteData]);

  const handleToggleDrawMode = () => setIsDrawingMode((v) => !v);

  const handleMapDrawEnd = useCallback((newPoints: LatLngExpression[]) => {
    if (!routeData) return;
    const Q: RoutePoint[] = (newPoints as LatLng[]).map((p) => ({ lat: p.lat, lng: p.lng }));
    if (Q.length < 2) return;
    const P = routeData.route_points;
    if (P.length < 2) return;

    const s = nearestVertexIndex(P, Q[0]);
    const t = nearestVertexIndex(P, Q[Q.length - 1]);
    let i = s.index, j = t.index;
    let Qdir = Q.slice();
    if (i > j) { [i, j] = [j, i]; Qdir = Qdir.slice().reverse(); }
    if (i === j) {
      if (i < P.length - 1) j = i + 1;
      else if (i > 0) i = i - 1;
      else return;
    }
    const Qsimplified = rdpSimplify(Qdir, 10);
    const snapped = Qsimplified.slice();
    snapped[0] = { ...P[i] };
    snapped[snapped.length - 1] = { ...P[j] };
    const Pnew = P.slice(0, i).concat(snapped, P.slice(j + 1));
    const newDistance = calculateTotalDistance(Pnew);
    const newData: ResponseData = {
      total_distance_km: newDistance,
      route_points: Pnew,
      drawing_points: routeData.drawing_points,
    };
    setHistory((prev) => [...prev, newData]);
    setRouteData(newData);
    setIsDrawingMode(false);
  }, [routeData]);

  if (!memoizedRouteData) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-md mx-auto p-4">
          <div className="text-center py-8">
            <Text text="データを読み込んでいます..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-md mx-auto px-4 pb-28 pt-4">
        {/* 見出し（用語を“コース”で統一） */}
        <div className="text-left mb-2 font-sans">
          <Title title="コースが完成しました" />
        </div>

        {/* ← 条件変更（/condition） */}
        {!isEditing && (
          <div className="mb-3">
            <BackButton text="条件を変更する" to="/condition" />
          </div>
        )}

        {/* 地図カード */}
        <div className="mb-3">
          <MadeRouteCard_Big
            routeData={memoizedRouteData}
            isDrawingMode={isDrawingMode}
            onDrawOnMap={handleMapDrawEnd}
            resetViewSignal={mapResetSeq}
          />
        </div>

        {/* 初期ボタン：左=描きなおす(/draw), 右=ルートを編集する */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/draw"
              className="w-full text-center rounded-2xl border border-neutral-200 bg-white py-3 font-semibold shadow-sm active:scale-[0.98] transition"
            >
              描きなおす
            </Link>
            <button
              onClick={handleEdit}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 font-semibold shadow-sm active:scale-[0.98] transition"
            >
              ルートを編集する
            </button>
          </div>
        )}

        {/* 編集モード中のボタン */}
        {isEditing && (
          <div className="space-y-3">
            {isDrawingMode ? (
              <div className="flex gap-2">
                <DrawButton
                  buttonText="描画完了"
                  onClick={handleToggleDrawMode}
                  icon={FaPaintBrush}
                  isActive={true}
                />
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <EditButton buttonText="編集完了" onClick={handleEdit} icon={FaPencilAlt} />
                </div>
                <div className="flex gap-2">
                  <DrawButton buttonText="地図に描画" onClick={handleToggleDrawMode} icon={FaPaintBrush} />
                </div>
                <div className="flex gap-2">
                  <UndoButton
                    buttonText="元に戻す"
                    onClick={handleUndo}
                    icon={FaUndo}
                    disabled={history.length <= 1}
                  />
                  <CancelButton buttonText="編集を破棄" onClick={handleCancelEdit} icon={FaTimes} />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 下部固定 保存ボタン */}
      {!isEditing && (
        <div className="fixed inset-x-0 bottom-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 bg-transparent">
          <button
            onClick={handleSaveCourse}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black text-white py-4 text-lg font-semibold shadow-lg active:scale-[0.98] transition disabled:bg-neutral-400 disabled:cursor-not-allowed"
          >
            <FaSave size={20} />
            <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
