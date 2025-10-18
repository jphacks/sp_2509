// app/page.tsx
"use client";

import { useState } from "react";
import Header from "../components/Header";
import Title from "../components/Title";
import RoutingButton from "../components/RoutingButton";
import { FaArrowRight } from "react-icons/fa";
import MadeRoute from "../components/MadeRoute";
import type { LatLngExpression } from "leaflet";
import Slider from "../components/Slider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Point = { x: number; y: number };

// ダミーのハート座標
function makeHeartPositions(): LatLngExpression[] {
  const base: Point[] = [
    { x: 175, y: 100 },
    { x: 205, y: 70 },
    { x: 235, y: 80 },
    { x: 250, y: 110 },
    { x: 235, y: 140 },
    { x: 175, y: 210 },
    { x: 115, y: 140 },
    { x: 100, y: 110 },
    { x: 115, y: 80 },
    { x: 145, y: 70 },
    { x: 175, y: 100 },
  ].map((p) => ({ x: (p.x * 350) / 300, y: (p.y * 350) / 300 }));

  return base.map((p) => {
    const lat = 43.06 - (p.y - 175) * 0.0005;
    const lng = 141.35 + (p.x - 175) * 0.0005;
    return [lat, lng] as [number, number];
  });
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ルートカード（単一の例）
  const [routeVisible, setRouteVisible] = useState(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(true); // 初期お気に入り状態
  const routeId = "route-1";
  const positions = makeHeartPositions();

  // Slider の状態
  const [sliderValue, setSliderValue] = useState<number>(50);

  const fetchMessage = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/message`);
      if (!res.ok) throw new Error("Failed to fetch message");
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 子から：削除通知 → 親で非表示（=stateから除去）
  const handleDelete = (id: string) => {
    if (id !== routeId) return;
    setRouteVisible(false);
    // API連携するなら成功後に setRouteVisible(false) でもOK
  };

  // 子から：お気に入り切替通知
  const handleToggleFavorite = (newValue: boolean, id: string) => {
    if (id !== routeId) return;
    setIsFavorite(newValue);
    // 必要なら API へ PATCH など
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Sample App</h1>

          {/* ルートカード（可視の時のみ描画） */}
          {routeVisible && (
            <MadeRoute
              id={routeId}
              positions={positions}
              course_distance={5.2}
              start_distance={1.3}
              created_at="2025-10-18T09:00:00Z"
              isFavorite={isFavorite}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {/* Slider コンポーネントの動作確認 */}
          <div className="w-full text-left space-y-4">
            <h2 className="text-xl font-semibold">
              Slider コンポーネントの動作確認{sliderValue}
            </h2>

            <Slider
              value={sliderValue}
              onChange={setSliderValue}
              min={0}
              max={30}
              step={1}
              unit="km"
            />
    
          </div>

          <Title title="Title" />
          <Header headerText="This is a header." />
          <RoutingButton buttonText="press" to="/home" icon={FaArrowRight} />

          <button
            onClick={fetchMessage}
            disabled={isLoading}
            className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 w-[250px]"
          >
            {isLoading ? "Loading..." : "Get Message from Backend"}
          </button>

          <div className="mt-6 min-h-[60px]">
            {error && <p className="mt-2 text-red-500">{error}</p>}
            {message && (
              <div>
                <p className="mt-4 text-lg">Message from backend:</p>
                <p className="mt-2 text-2xl font-semibold text-green-500">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
