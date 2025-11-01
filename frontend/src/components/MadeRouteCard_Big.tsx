"use client";

import React from "react";
import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type RoutePoint = { lat: number; lng: number };

type RouteData = {
  total_distance_km: number;
  route_points: RoutePoint[];
  drawing_points: RoutePoint[];
};

type MadeRouteCardBigProps = {
  routeData: RouteData;
  isDrawingMode?: boolean;
  onDrawOnMap?: (points: LatLngExpression[]) => void;
  /** ★ 追加：外部からの「初期縮尺に戻す」シグナル */
  resetViewSignal?: number;
};

export default function MadeRouteCard_Big({
  routeData,
  isDrawingMode = false,
  onDrawOnMap,
  resetViewSignal = 0,
}: MadeRouteCardBigProps) {
  const { total_distance_km, route_points } = routeData;

  const routePositions: LatLngExpression[] = route_points.map((p) => [p.lat, p.lng]);
  const secondaryPositions: LatLngExpression[] = [];

  const fmtKm = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");
  const MAP_HEIGHT = 300;

  const mapInteractive = !isDrawingMode;
  const showZoom = !isDrawingMode;

  return (
    <article
      className="relative rounded-3xl border border-neutral-200/70 bg-white shadow-sm transition-shadow p-2 pb-4 font-sans"
      style={{ height: "361px" }}
      aria-label="RouteCard"
    >
      <div className="h-full flex flex-col">
        <div className="flex-grow rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
          <RouteMap
            positions={routePositions}
            secondaryPositions={secondaryPositions}
            height={MAP_HEIGHT}
            width="100%"
            padding={15}
            maxZoom={16}
            interactive={mapInteractive}
            showZoomControl={showZoom}
            isDrawingMode={isDrawingMode}
            onDrawOnMap={onDrawOnMap}
            fitOnMountOnly={true}
            /** ★ 渡す：この値が変わったら初期fitBoundsを再実行 */
            resetViewSignal={resetViewSignal}
          />
        </div>

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
