// frontend/src/components/RouteMapHome.tsx
"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngBounds, type LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { startIcon, goalIcon } from "./MapIcons";
import { ACCENT_AMBER } from "../lib/color";

const GradientPolyline = dynamic(
    () => import("./MapComponents").then((mod) => mod.GradientPolyline),
    { ssr: false }
);
const DashedPolyline = dynamic(
    () => import("./MapComponents").then((mod) => mod.DashedPolyline),
    { ssr: false }
);

type CSSSize = number | string;

interface RouteMapHomeProps {
    /** 青線：ルート */
    positions?: LatLngExpression[];
    /** 破線：補助線（任意） */
    secondaryPositions?: LatLngExpression[];
    /** 表示サイズ */
    height?: CSSSize;
    width?: CSSSize;
    /** fitBounds の余白(px) */
    padding?: number;
    /** 最大ズーム */
    maxZoom?: number;
    /** 初回だけ fitBounds（true 推奨） */
    fitOnMountOnly?: boolean;
    /** リセットトリガ */
    resetViewSignal?: number;
}

/** 表示用の fitBounds（描画や操作は一切しない） */
const FitBounds = ({
    positions,
    secondaryPositions,
    padding = 5,
    maxZoom = 16,
    fitOnMountOnly = true,
    resetViewSignal,
}: {
    positions?: LatLngExpression[];
    secondaryPositions?: LatLngExpression[];
    padding?: number;
    maxZoom?: number;
    fitOnMountOnly?: boolean;
    resetViewSignal?: number;
}) => {
    const map = useMap();
    const didFitOnce = useRef(false);
    const lastReset = useRef<number | undefined>(undefined);

    useEffect(() => {
        const resetChanged =
            resetViewSignal !== undefined && resetViewSignal !== lastReset.current;
        if (fitOnMountOnly && didFitOnce.current && !resetChanged) return;

        const all = [...(positions || []), ...(secondaryPositions || [])];
        if (all.length === 0) return;

        const bounds = new LatLngBounds(all);
        map.fitBounds(bounds, { padding: [padding, padding], maxZoom });

        if (fitOnMountOnly) didFitOnce.current = true;
        if (resetChanged) lastReset.current = resetViewSignal;
    }, [positions, secondaryPositions, padding, maxZoom, map, fitOnMountOnly, resetViewSignal]);

    return null;
};

/** 物理的に一切のインタラクションを不能化（見た目も） */
const HardLock = () => {
    const map = useMap();
    useEffect(() => {
        // 念のため API でも無効化（MapContainer 側でも false 指定済み）
        (map as any).dragging?.disable?.();
        (map as any).touchZoom?.disable?.();
        (map as any).scrollWheelZoom?.disable?.();
        (map as any).doubleClickZoom?.disable?.();
        (map as any).boxZoom?.disable?.();
        (map as any).keyboard?.disable?.();

        // DOM レベルで完全ロック
        const c = map.getContainer();
        c.style.pointerEvents = "none";
        c.style.touchAction = "none";
        c.style.cursor = "default";
    }, [map]);
    return null;
};

export default function RouteMapHome({
    positions,
    secondaryPositions,
    height = 200,
    width = "100%",
    padding = 5,
    maxZoom = 16,
    fitOnMountOnly = true,
    resetViewSignal,
}: RouteMapHomeProps) {
    const h = typeof height === "number" ? `${height}px` : height;
    const w = typeof width === "number" ? `${width}px` : width;

    const startPosition = positions?.[0] || secondaryPositions?.[0];
    const goalPosition =
        positions && positions.length > 1 ? positions[positions.length - 1] : null;

    return (
        <MapContainer
            style={{ height: h, width: w }}
            attributionControl={false}
            zoomControl={false}
            // すべての操作を無効化
            dragging={false}
            touchZoom={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            boxZoom={false}
            keyboard={false}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {positions && positions.length > 0 && (
                <GradientPolyline positions={positions as [number, number][]} />
            )}
            {secondaryPositions && secondaryPositions.length > 0 && (
                <DashedPolyline
                    positions={secondaryPositions as [number, number][]}
                    color={ACCENT_AMBER}
                    weight={2}
                    dashArray="10, 5"
                />
            )}

            {goalPosition && <Marker position={goalPosition} icon={goalIcon} />}
            {startPosition && <Marker position={startPosition} icon={startIcon} />}

            <FitBounds
                positions={positions}
                secondaryPositions={secondaryPositions}
                padding={padding}
                maxZoom={maxZoom}
                fitOnMountOnly={fitOnMountOnly}
                resetViewSignal={resetViewSignal}
            />

            <HardLock />
        </MapContainer>
    );
}
