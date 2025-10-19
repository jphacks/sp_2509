"use client";

import React from "react";
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
  /** コースデータ */
  routeData: RouteData;
};

export default function MadeRouteCard_Big({
  routeData,
}: MadeRouteCardBigProps) {
  const { total_distance_km, route_points, drawing_points } = routeData;

  // route_points を LatLngExpression の配列に変換
  const routePositions: LatLngExpression[] = route_points.map((point) => [
    point.lat,
    point.lng,
  ]);

  // drawing_points を LatLngExpression の配列に変換
  const drawingPositions: LatLngExpression[] = drawing_points.map((point) => [
    point.lat,
    point.lng,
  ]);

  const fmtKm = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");

  const MAP_HEIGHT = 300;

  return (
    <article
      className="relative rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition-shadow p-4 font-sans"
      style={{ height: "361px" }}
      aria-label="RouteCard"
    >
      <div className="h-full flex flex-col">
        {/* 上:地図 */}
        <div className="flex-grow rounded-xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
          <RouteMap
            positions={routePositions}
            secondaryPositions={drawingPositions}
            height={MAP_HEIGHT}
            width="100%"
            padding={15}
            maxZoom={16}
            interactive={true}
            showZoomControl={false}
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
