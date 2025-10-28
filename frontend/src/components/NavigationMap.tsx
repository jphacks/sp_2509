"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-polylinedecorator";
import { HiSun, HiMoon } from "react-icons/hi";
import { MdOutlineTurnLeft, MdOutlineTurnRight, MdOutlineUTurnRight } from "react-icons/md";
import { FaRunning } from "react-icons/fa";
import { useRouter } from "next/navigation";

type RouteData = {
  id: string;
  total_distance_km: number;
  route_points: Array<{ lat: number; lng: number }>;
  start_distance: number;
  created_at: string;
  isFavorite: boolean;
};

type NavigationMapProps = {
  routeData: RouteData;
};

// 現在位置アイコン（青い点）
const currentLocationIcon = L.divIcon({
  html: `
    <div style="
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// スタートピンアイコン（青 - コースの開始色）
const startIcon = L.divIcon({
  html: `
    <svg width="48" height="60" viewBox="0 0 40 50">
      <path d="M20 5c-6.5 0-12 5.5-12 12 0 8 10 18 11.5 19.5.3.3.7.3 1 0C22 35 32 25 32 17c0-6.5-5.5-12-12-12z"
            fill="#1052F6" stroke="#0D47D1" stroke-width="2"/>
      <circle cx="20" cy="17" r="8" fill="white"/>
      <text x="20" y="21" text-anchor="middle" fill="#1052F6" font-size="12" font-weight="bold">S</text>
    </svg>
  `,
  className: "",
  iconSize: [48, 60],
  iconAnchor: [24, 44],
});

// ゴールピンアイコン（緑 - コースの終了色）
const goalIcon = L.divIcon({
  html: `
    <svg width="48" height="60" viewBox="0 0 40 50">
      <path d="M20 5c-6.5 0-12 5.5-12 12 0 8 10 18 11.5 19.5.3.3.7.3 1 0C22 35 32 25 32 17c0-6.5-5.5-12-12-12z"
            fill="#20B950" stroke="#16A34A" stroke-width="2"/>
      <circle cx="20" cy="17" r="8" fill="white"/>
      <text x="20" y="21" text-anchor="middle" fill="#20B950" font-size="12" font-weight="bold">G</text>
    </svg>
  `,
  className: "",
  iconSize: [48, 60],
  iconAnchor: [24, 44],
});

// グラデーション付きPolylineを描画するコンポーネント
function GradientPolyline({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    // 複数のセグメントに分割してグラデーション効果を作成
    const segments: L.Polyline[] = [];
    const segmentCount = Math.min(positions.length - 1, 20); // 最大20セグメント

    for (let i = 0; i < segmentCount; i++) {
      const startIndex = Math.floor((i * (positions.length - 1)) / segmentCount);
      const endIndex = Math.floor(((i + 1) * (positions.length - 1)) / segmentCount);

      if (startIndex === endIndex) continue;

      const segmentPositions = positions.slice(startIndex, endIndex + 1);

      // グラデーション色の計算（青から緑へ）
      const ratio = i / (segmentCount - 1);
      const red = Math.round(16 + (16 * ratio)); // 16 → 32
      const green = Math.round(82 + (103 * ratio)); // 82 → 185
      const blue = Math.round(246 - (166 * ratio)); // 246 → 80

      const color = `rgb(${red}, ${green}, ${blue})`;

      const polyline = L.polyline(segmentPositions, {
        color: color,
        weight: 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      segments.push(polyline);
    }

    // クリーンアップ関数
    return () => {
      segments.forEach(segment => {
        map.removeLayer(segment);
      });
    };
  }, [map, positions]);

  return null;
}

// 現在位置を追跡してマップを更新するコンポーネント
function LocationTracker({ currentPosition, energySaveMode }: {
  currentPosition: [number, number] | null;
  energySaveMode: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (currentPosition && !energySaveMode) {
      map.setView(currentPosition, 16, { animate: true });
    }
  }, [currentPosition, map, energySaveMode]);

  return null;
}

export default function NavigationMap({ routeData }: NavigationMapProps) {
  const router = useRouter();
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [energySaveMode, setEnergySaveMode] = useState(false);
  const [navigationInstruction, setNavigationInstruction] = useState("コースに沿って進んでください");
  const watchIdRef = useRef<number | null>(null);

  // 位置情報の取得
  useEffect(() => {
    if (navigator.geolocation) {
      // 初回取得
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentPosition(pos);
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
          // デフォルト位置（札幌）
          setCurrentPosition([43.0621, 141.3544]);
        }
      );

      // 定期的な更新（3秒間隔）
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const pos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentPosition(pos);
        },
        (error) => {
          console.error("位置情報の更新に失敗しました:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );
    } else {
      // デフォルト位置（札幌）
      setCurrentPosition([43.0621, 141.3544]);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ルートの座標を準備
  const routePositions: [number, number][] = routeData.route_points.map(p => [p.lat, p.lng]);

  // 初期中心位置（ルートの最初の点か現在位置）
  const initialCenter: [number, number] = currentPosition ||
    (routePositions.length > 0 ? routePositions[0] : [43.0621, 141.3544]);

  const handleBack = () => {
    router.back();
  };

  const toggleEnergySaveMode = () => {
    setEnergySaveMode(!energySaveMode);
  };

  // 省エネモード時は黒画面
  if (energySaveMode) {
    return (
      <div className="w-full h-screen bg-black flex flex-col text-white">
        {/* 上部UI */}
        <div className="flex justify-between items-center p-6">
          <div className="text-center">
            <p className="text-white text-lg font-bold">省エネモード</p>
            <p className="text-gray-400 text-sm">残り {routeData.total_distance_km.toFixed(1)}km</p>
          </div>

          <button
            onClick={toggleEnergySaveMode}
            className="flex items-center justify-center w-12 h-12"
          >
            <HiSun size={20} className="text-white" />
          </button>
        </div>

        {/* 中央のナビゲーション情報 */}
        <div className="flex-1 flex flex-col justify-center items-center px-8">
          {/* 次の案内情報 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <MdOutlineTurnRight size={64} />
              <div>
                <span className="text-white font-bold text-5xl">100</span>
                <span className="text-white text-2xl ml-2">m</span>
              </div>
            </div>
            <p className="text-gray-300 text-lg">まっすぐ進んでください</p>
          </div>
        </div>

        {/* 省電力表示 */}
        <div className="pb-4 text-center">
          <p className="text-gray-500 text-xs">🔋 省電力モードで実行中</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* 地図 */}
      <MapContainer
        center={initialCenter}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* ゴールマーカー（最背面） */}
        {routePositions.length > 1 && (
          <Marker
            position={routePositions[routePositions.length - 1]}
            icon={goalIcon}
          />
        )}

        {/* グラデーション付きルート線 */}
        {routePositions.length > 1 && (
          <GradientPolyline positions={routePositions} />
        )}

        {/* スタートマーカー */}
        {routePositions.length > 0 && (
          <Marker
            position={routePositions[0]}
            icon={startIcon}
          />
        )}

        {/* 現在位置マーカー（最前面） */}
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={currentLocationIcon}
          />
        )}

        {/* 位置追跡 */}
        <LocationTracker
          currentPosition={currentPosition}
          energySaveMode={energySaveMode}
        />
      </MapContainer>

      {/* 地図上のグラデーションオーバーレイ */}
      <div className="absolute inset-0 z-[500] bg-gradient-to-b from-white/80 via-transparent via-25% to-transparent pointer-events-none" />

      {/* 左上: タイトル */}
      <div className="absolute top-6 left-4 z-[1000]">
        <h1 className="text-black text-3xl font-bold drop-shadow-md">コース案内中</h1>
      </div>

      {/* 右上: 省エネモードボタン */}
      <div className="absolute top-6 right-4 z-[1000]">
        <button
          onClick={toggleEnergySaveMode}
          className="flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-md"
        >
          <HiMoon size={24} className="text-black" />
        </button>
      </div>

      {/* 左下: ナビゲーション案内枠 */}
      <div className="absolute bottom-24 left-4 z-[1000] bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 w-60">
        <div className="space-y-4">
          {/* 次の案内 */}
          <div className="flex items-center gap-3">
            <MdOutlineTurnRight size={32} />
            <div>
              <span className="text-black font-bold text-2xl">100</span>
              <span className="text-black text-base ml-1">m</span>
            </div>
          </div>

          {/* その次の案内 */}
          <div className="flex items-center gap-3">
            <MdOutlineTurnLeft size={32} />
            <div>
              <span className="text-black font-bold text-2xl">240</span>
              <span className="text-black text-base ml-1">m</span>
            </div>
          </div>

          {/* さらに次の案内 */}
          <div className="flex items-center gap-3">
            <MdOutlineUTurnRight size={32} />
            <div>
              <span className="text-black font-bold text-2xl">320</span>
              <span className="text-black text-base ml-1">m</span>
            </div>
          </div>
        </div>
      </div>



      {/* 最下部: ランニング終了ボタン */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000]">
        <button
          onClick={handleBack}
          className="w-full bg-black rounded-2xl py-4 shadow-lg flex items-center justify-center gap-2"
        >
          <FaRunning size={24} className="text-white" />
          <span className="text-white font-medium">ランニングを終了する</span>
        </button>
      </div>
    </div>
  );
}