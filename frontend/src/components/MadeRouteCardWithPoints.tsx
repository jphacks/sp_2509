"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const RouteMapWithPoints = dynamic(() => import("./RouteMapWithPoints"), {
    ssr: false,
});

type RoutePoint = { lat: number; lng: number };

type RouteData = {
    total_distance_km: number;
    route_points: RoutePoint[];
    drawing_points: RoutePoint[];
};

type MadeRouteCardWithPointsProps = {
    routeData: RouteData;
};

export default function MadeRouteCardWithPoints({
    routeData,
}: MadeRouteCardWithPointsProps) {
    const { total_distance_km, route_points, drawing_points } = routeData;

    const routePts = useMemo(
        () => route_points.map<[number, number]>((p) => [p.lat, p.lng]),
        [route_points]
    );
    const drawingPts = useMemo(
        () => drawing_points.map<[number, number]>((p) => [p.lat, p.lng]),
        [drawing_points]
    );

    const fmtKm = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");

    return (
        <article
            className="relative rounded-3xl border border-neutral-200/70 bg-white shadow-sm transition-shadow p-2 pb-4 font-sans"
            style={{ height: "361px" }}
            aria-label="RouteCard"
        >
            <div className="h-full flex flex-col">
                <div className="flex-grow rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
                    <RouteMapWithPoints
                        positions={routePts}
                        secondaryPositions={drawingPts}
                        showRoutePoints
                        routePointRadius={6}
                        editable={true}
                        autoFitOnce={true}
                        onPositionsChange={(newPts) => {
                            console.log("moved:", newPts);
                            // 必要なら localStorage へ保存するなど：
                            // localStorage.setItem("responsePointsData", JSON.stringify({
                            //   ...routeData,
                            //   route_points: newPts.map(([lat,lng]) => ({lat,lng}))
                            // }));
                        }}
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
