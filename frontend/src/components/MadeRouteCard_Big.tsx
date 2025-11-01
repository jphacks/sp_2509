// frontend/src/components/MadeRouteCard_Big.tsx
"use client";

import React from "react";
// ★ 修正: import type
import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type RoutePoint = {
  lat: number;
  lng: number;
};

type RouteData = {
  total_distance_km: number;
  route_points: RoutePoint[];
  drawing_points: RoutePoint[];
};

type MadeRouteCardBigProps = {
  /** ルートデータ */
  routeData: RouteData;
  /** ★ 描画モード（trueならfitBoundsを無効化） */
  isDrawingMode?: boolean;
  /** ★ 新しい prop: 描画完了時にLatLngの配列を返す */
  onDrawOnMap?: (points: LatLngExpression[]) => void;
};

export default function MadeRouteCard_Big({
  routeData,
  isDrawingMode = false,
  onDrawOnMap, // ★ prop を受け取る
}: MadeRouteCardBigProps) {
  const { total_distance_km, route_points } = routeData;

  // route_points を LatLngExpression の配列に変換
  const routePositions: LatLngExpression[] = route_points.map((point) => [
    point.lat,
    point.lng,
  ]);

  const secondaryPositions: LatLngExpression[] = [];

  const fmtKm = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");

  const MAP_HEIGHT = 300;

  // ★★★ ここでロジックを実行 ★★★
  // isDrawingMode が true なら、地図の操作を無効にする (interactive = false)
  const mapInteractive = !isDrawingMode;
  // isDrawingMode が true なら、ズームコントロールも無効にする
  const showZoom = !isDrawingMode;
  // ★★★ ロジックここまで ★★★

  return (
    <article
      className="relative rounded-3xl border border-neutral-200/70 bg-white shadow-sm transition-shadow p-2 pb-4 font-sans"
      style={{ height: "361px" }}
      aria-label="RouteCard"
    >
      <div className="h-full flex flex-col">
        {/* 上:地図 */}
        <div className="flex-grow rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
          <RouteMap
            positions={routePositions}
            secondaryPositions={secondaryPositions}
            height={MAP_HEIGHT}
            width="100%"
            padding={15}
            maxZoom={16}
            interactive={mapInteractive} // ★ 修正後の値（mapInteractive）を渡す
            showZoomControl={showZoom} // ★ 修正後の値（showZoom）を渡す
            isDrawingMode={isDrawingMode} // ★ ズーム維持のためにフラグは渡す
            onDrawOnMap={onDrawOnMap} // ★ prop を渡す
          />
        </div>

        {/* 下:テキスト */}
        <div className="shrink-0 pt-4 text-left">
          <div className="flex justify-between items-baseline">
            <div className="text-[15px] text-neutral-600">コース距離</div>
            <div className="text-[22px] font-extrabold leading-tight">
              {fmtKm(total_distance_km)}km
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}