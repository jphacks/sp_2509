// RouteMapWithPoints.tsx
"use client";

import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
    LatLngExpression,
    divIcon,
    LatLngBounds,
    Map as LeafletMap,
    Marker as LeafletMarker,
} from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

type CSSSize = number | string;

export interface RouteMapWithPointsProps {
    positions?: LatLngExpression[];
    secondaryPositions?: LatLngExpression[];
    height?: CSSSize;
    width?: CSSSize;
    padding?: number;
    maxZoom?: number;
    interactive?: boolean;
    showZoomControl?: boolean;
    showRoutePoints?: boolean;
    routePointRadius?: number;
    editable?: boolean;
    onPositionsChange?: (latlngs: [number, number][]) => void;
    autoFitOnce?: boolean;
}

/** 初回だけズーム・位置合わせ */
const FitBoundsOnce = ({
    positions,
    secondaryPositions,
    padding = 5,
    maxZoom = 16,
    enabled = true,
}: {
    positions?: LatLngExpression[];
    secondaryPositions?: LatLngExpression[];
    padding?: number;
    maxZoom?: number;
    enabled?: boolean;
}) => {
    const map = useMap();
    const did = useRef(false);

    useEffect(() => {
        if (!enabled || did.current) return;
        const all = [...(positions || []), ...(secondaryPositions || [])] as
            | [number, number][]
            | [];
        if (all.length === 0) return;
        const bounds = new LatLngBounds(all);
        map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
        did.current = true;
    }, [enabled, positions?.length, secondaryPositions?.length, padding, maxZoom, map]);

    return null;
};

function setMapInteractive(map: LeafletMap, on: boolean) {
    if (on) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
    } else {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
    }
}

/** ホバーで黄色化・ドラッグで座標を更新（hoverは親で一元管理） */
const DraggablePoint = ({
    index,
    position,
    baseRadius,
    editable,
    hoveredIndex,
    setHoveredIndex,
    onMoveLive,
    onMoveEnd,
}: {
    index: number;
    position: [number, number];
    baseRadius: number;
    editable: boolean;
    hoveredIndex: number | null;
    setHoveredIndex: (i: number | null) => void;
    onMoveLive: (idx: number, lat: number, lng: number) => void;
    onMoveEnd: (idx: number, lat: number, lng: number) => void;
}) => {
    const map = useMap();
    const markerRef = useRef<LeafletMarker | null>(null);
    const hovered = hoveredIndex === index;

    const sizePx = hovered ? baseRadius + 8 : baseRadius + 4;
    const bgColor = hovered ? "#FFD400" : "#07D8F9";
    const borderColor = hovered ? "#B58900" : "#1E40CF";
    const boxShadow = hovered ? "0 0 0 4px rgba(255,212,0,0.35)" : "none";

    const icon = useMemo(
        () =>
            divIcon({
                html: `
        <div style="
          width:${sizePx}px;
          height:${sizePx}px;
          border-radius:50%;
          background:${bgColor};
          border:${hovered ? 3 : 2}px solid ${borderColor};
          box-shadow:${boxShadow};
          transition: box-shadow .12s ease, background .08s ease, border-color .08s ease;
        "></div>`,
                className: "",
                iconSize: [sizePx, sizePx],
                iconAnchor: [sizePx / 2, sizePx / 2],
            }),
        [sizePx, bgColor, borderColor, boxShadow, hovered]
    );

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={icon}
            draggable={editable}
            zIndexOffset={500}
            eventHandlers={{
                mouseover: () => {
                    setHoveredIndex(index);
                    setMapInteractive(map, false);
                },
                mouseout: () => {
                    setHoveredIndex(null);
                    setMapInteractive(map, true);
                },
                dragstart: () => {
                    setMapInteractive(map, false);
                },
                drag: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onMoveLive(index, lat, lng);
                },
                dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onMoveEnd(index, lat, lng);
                    setMapInteractive(map, true);
                },
            }}
        />
    );
};

export default function RouteMapWithPoints({
    positions,
    secondaryPositions,
    height = 400,
    width = "100%",
    padding = 5,
    maxZoom = 16,
    interactive = true,
    showZoomControl = true,
    showRoutePoints = true,
    routePointRadius = 6,
    editable = true,
    onPositionsChange,
    autoFitOnce = true,
}: RouteMapWithPointsProps) {
    const h = typeof height === "number" ? `${height}px` : height;
    const w = typeof width === "number" ? `${width}px` : width;

    // 編集用の内部ステート
    const [pts, setPts] = useState<[number, number][]>(
        () => (positions ?? []) as [number, number][]
    );
    const ptsRef = useRef(pts);
    useEffect(() => {
        ptsRef.current = pts;
    }, [pts]);

    // 外から positions が変わった場合は同期
    useEffect(() => {
        if (!positions) return;
        const next = positions as [number, number][];
        const same =
            ptsRef.current.length === next.length &&
            ptsRef.current.every((p, i) => p[0] === next[i][0] && p[1] === next[i][1]);
        if (!same) setPts(next);
    }, [positions]);

    // ホバーの一元管理
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const startPosition =
        (pts?.[0] as [number, number]) ??
        ((secondaryPositions?.[0] as [number, number]) ?? [35.681236, 139.767125]);

    // Sマーク
    const startIcon = useMemo(
        () =>
            divIcon({
                html: `<div style="
          background-color:#4A90E2;
          color:white;
          border-radius:50%;
          width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          font-weight:bold;border:2px solid white;
          pointer-events:none;
        ">S</div>`,
                className: "",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            }),
        []
    );

    // ★ Polyline を命令的に更新するための ref
    const polyRefThin = useRef<L.Polyline | null>(null);
    const polyRefThick = useRef<L.Polyline | null>(null);

    // ★ ドラッグ中は state を更新しない
    const handleMoveLive = (idx: number, lat: number, lng: number) => {
        const next = [...ptsRef.current];
        next[idx] = [lat, lng];
        polyRefThin.current?.setLatLngs(next as any);
        polyRefThick.current?.setLatLngs(next as any);
    };

    // ★ ドラッグ終了時のみ state を更新＋通知
    const handleMoveEnd = (idx: number, lat: number, lng: number) => {
        setPts((prev) => {
            const next = [...prev];
            next[idx] = [lat, lng];
            return next;
        });
        const updated = [...ptsRef.current];
        updated[idx] = [lat, lng];
        onPositionsChange?.(updated);
    };

    return (
        <MapContainer
            style={{ height: h, width: w }}
            attributionControl={false}
            zoomControl={showZoomControl}
            dragging={interactive}
            touchZoom={interactive}
            doubleClickZoom={interactive}
            scrollWheelZoom={interactive}
            boxZoom={interactive}
            keyboard={interactive}
            center={startPosition}
            zoom={14}
            markerZoomAnimation={false}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {/* 赤の補助ライン */}
            {secondaryPositions && secondaryPositions.length > 0 && (
                <Polyline positions={secondaryPositions} color="red" weight={3} interactive={false} />
            )}

            {/* 青のメインルート */}
            {pts.length > 0 && (
                <>
                    <Polyline
                        ref={polyRefThick as any}
                        positions={pts}
                        color="#1E40CF"
                        weight={8}
                        opacity={0.6}
                        interactive={false}
                    />
                    <Polyline
                        ref={polyRefThin as any}
                        positions={pts}
                        color="#07D8F9"
                        weight={4}
                        opacity={0.9}
                        interactive={false}
                    />
                </>
            )}

            {/* 点群（ホバーで黄色・ドラッグ可） */}
            {showRoutePoints &&
                pts.map((pos, i) => (
                    <DraggablePoint
                        key={`pt-${i}`}
                        index={i}
                        position={pos}
                        baseRadius={routePointRadius}
                        editable={editable}
                        hoveredIndex={hoveredIndex}
                        setHoveredIndex={setHoveredIndex}
                        onMoveLive={handleMoveLive}
                        onMoveEnd={handleMoveEnd}
                    />
                ))}

            {/* スタート位置 */}
            {pts.length > 0 && (
                <Marker position={pts[0]} icon={startIcon} interactive={false} zIndexOffset={3000} />
            )}

            {/* 初回のみフィット */}
            <FitBoundsOnce
                positions={pts}
                secondaryPositions={secondaryPositions}
                padding={padding}
                maxZoom={maxZoom}
                enabled={autoFitOnce}
            />
        </MapContainer>
    );
}
