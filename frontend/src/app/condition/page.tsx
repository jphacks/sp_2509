// jphacks/sp_2509/sp_2509-a378f8e8d74c8510cd17bbdfc0eecd7d10652dd6/frontend/src/app/condition/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DrawnShapeImage from "../../components/DrawnShapeImage";
import Slider from "../../components/Slider";
import Loading from "../../components/Loading";
import Text from "../../components/Text";
import type { Point } from "../../types/types";
import Title from "@/components/Title";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import RoutingButton from "../../components/RoutingButton";
import { SlGraph } from "react-icons/sl";
import Image from "next/image";
import { ACCENT_AMBER } from "../../lib/color";

const CenterPinMap = dynamic(() => import("../../components/CenterPinMap"), {
  ssr: false,
});

const API_URL = "/api";

// ★ レスポンスデータの型を定義 (必要に応じて src/types/types.ts に移動)
type LatLng = { lat: number; lng: number };
type RouteCalculateResponse = {
  total_distance_km: number;
  route_points: LatLng[];
  drawing_points: LatLng[]; // API は描画点の地理座標も返す
};

export default function Condition() {
  const router = useRouter();

  // localStorage から読み込む描画点
  const [loadedDrawingPoints, setLoadedDrawingPoints] = useState<Point[]>([]);
  // 地図中心（スタート地点）
  const [startLocation, setStartLocation] = useState<[number, number] | null>(null);
  // おおよその走行距離（km）
  const [distanceKm, setDistanceKm] = useState<number>(10);
  // 送信中制御
  const [submitting, setSubmitting] = useState(false);

  // 初回マウント時に描画データとスタート地点を読み込み
  useEffect(() => {
    try {
      // スタート地点の読み込み
      const savedLocation = localStorage.getItem('startLocation');
      if (savedLocation) {
        setStartLocation(JSON.parse(savedLocation));
      } else {
        alert("スタート地点が設定されていません。");
        router.push('/start');
        return;
      }

      // 描画データの読み込み
      const savedDrawing = localStorage.getItem("drawingPointsData");
      if (!savedDrawing) {
        alert(
          "描画データが見つかりません。前のページでコースを描いてください。"
        );
        router.push('/draw');
        return;
      }
      const points = JSON.parse(savedDrawing) as Point[];
      if (!Array.isArray(points) || points.length === 0) {
        alert("コース形状の読み込みに失敗しました。");
        router.push('/draw');
        return;
      }
      setLoadedDrawingPoints(points);
    } catch (e) {
      console.error("Failed to parse data from localStorage:", e);
      alert("データの読み込みに失敗しました。");
      router.push('/home');
    }
  }, [router]);

  const canSubmit = useMemo(
    () => !!startLocation && loadedDrawingPoints.length > 0 && !submitting,
    [startLocation, loadedDrawingPoints.length, submitting]
  );

  // 次のページへ：バックエンドに POST。
  const goNext = async () => {
    if (!startLocation) {
      alert("スタート地点が設定されていません。");
      router.push('/start');
      return;
    }
    if (submitting) return; // 二重送信防止

    const [lat, lng] = startLocation;

    // 送信用ペイロード
    const payload = {
      drawing_display_points: loadedDrawingPoints, // 点群データ（描いたコース）
      start_location: { lat, lng }, // 赤ピン座標
      target_distance_km: distanceKm, // スライダー値
    } as const;

    console.log("送信します");
    setSubmitting(true); // ★ 押した瞬間にローディングへ切替
    try {
      const res = await fetch(`${API_URL}/routes/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // サーバーが routeId を返す想定
        console.log("返ってきた");
        const data: RouteCalculateResponse = await res.json();
        localStorage.setItem("responsePointsData", JSON.stringify(data));

        // /route へ遷移（IDがあるならそれを使う）
        router.push(`/route`);
      }
    } catch (e) {
      console.error("Failed to parse drawing points from localStorage:", e);
    } finally {
      //setSubmitting(false);
    }
  };

  // ★ 送信中はフルスクリーンのローディング画面を表示（完了したら goNext 内の router.push で遷移）
  if (submitting) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Loading
          loadingText="コースを計算中…"
          points={loadedDrawingPoints}
          size={120}
          strokeColor={ACCENT_AMBER}
          strokeWidth={2.5}
          dotColor={ACCENT_AMBER}
          dotSize={4}
          animationDuration={2.2}
          pauseDuration={0.8}
        />
        <Text text="この処理は30秒程度かかる可能性があります。" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Title title="条件設定" />
          <div className="w-full self-start mt-2">
            <BackButton text="描き直す" to="/draw" />
          </div>
        </div>

        {/* プレビュー：あなたの描いた絵 */}
        <section className="space-y-1">
          <div className="mt-4 text-black">
            <Header headerText="あなたの描いた絵" />
          </div>
          <DrawnShapeImage
            points={loadedDrawingPoints}
            size={100}
            strokeColor="#EA580C"
            strokeWidth={3}
            padding={8}
            className="bg-gray-100 border border-gray-300"
          />
        </section>



        <section>
          <Header headerText="おおよその走行距離" />
          <Text text="どれくらいの距離のコースを作成しますか？" />
          <div className="flex justify-center mt-4">
            <Image
              src={distanceKm < 12 ? "/images/running.png" : "/images/cycling.png"}
              alt={distanceKm < 12 ? "Running" : "Cycling"}
              width={200}
              height={200}
              unoptimized
            />
          </div>
          <Slider
            value={distanceKm}
            onChange={setDistanceKm}
            min={1}
            max={25}
            step={1}
            unit="km"
          />
        </section>

        <div className="mt-8 flex justify-center">
          <RoutingButton
            buttonText={submitting ? "送信中…" : "この内容でコースを作成"}
            onClick={goNext}
            disabled={!canSubmit}
            icon={SlGraph}
          />
        </div>

      </div>
    </main>
  );
}
