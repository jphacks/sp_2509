"use client";

import React from "react";
import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type MadeRouteCardBigProps = {
    /** 地図上のルート座標 */
    positions?: LatLngExpression[];

    /** コース距離 (km) */
    course_distance?: number | string | null;
};

export default function MadeRouteCard_Big({
    positions,
    course_distance,
}: MadeRouteCardBigProps) {
    const toNum = (v: unknown) =>
        typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
    const fmtKm = (v: unknown) => (Number.isFinite(toNum(v)) ? toNum(v).toFixed(1) : "—");

    const MAP_HEIGHT = 300;

    return (
        <article
            className="relative rounded-2xl border border-neutral-200/70 bg-white
                 shadow-sm transition-shadow p-4"
            style={{ height: "361px" }}
            aria-label="RouteCard"
        >
            <div className="h-full flex flex-col">
                {/* 上：地図 */}
                <div
                    className="flex-grow rounded-xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
                >
                    <RouteMap
                        positions={positions}
                        height={MAP_HEIGHT}
                        width="100%"
                        padding={15} // 少し広めに
                        maxZoom={16}
                        interactive={true} // インタラクティブ機能は有効
                        showZoomControl={false} // ズームコントロールボタンは非表示
                    />
                </div>

                {/* 下：テキスト */}
                <div className="shrink-0 pt-4 text-left">
                    <div className="flex justify-between items-baseline">
                        <div className="text-[15px] text-neutral-600">コース距離</div>
                        <div className="text-[22px] font-extrabold leading-tight">
                            {fmtKm(course_distance)}km
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
