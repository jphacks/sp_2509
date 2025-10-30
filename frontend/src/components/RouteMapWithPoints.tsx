"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon, LatLngBounds, LeafletEvent } from "leaflet";
import { useEffect, useState, useMemo } from "react";

type CSSSize = number | string;

interface RouteMapWithPointsProps {
    /** route_points用の座標（青い線・ドラッグ可能な点） */
    positions?: LatLngExpression[];
    /** drawing_points用の座標（赤い線・ドラッグ可能な点） */
    secondaryPositions?: LatLngExpression[];
    /** 実コンテナの高さ（fitBoundsのズーム決定に影響） */
    height?: CSSSize;
    /** 実コンテナの幅（fitBoundsのズーム決定に影響） */
    width?: CSSSize;
    /** fitBoundsの余白(px)。大きいほど引き気味 */
    padding?: number;
    /** 近づきすぎ防止の上限ズーム */
    maxZoom?: number;
    /** 地図の操作（ズーム・ドラッグ）を許可するか */
    interactive?: boolean; // default: true
    /** ズームコントロールボタンを表示するか */
    showZoomControl?: boolean; // default: true
    /** 赤い点の位置が変更されたときに親コンポーネントに通知するコールバック */
    onPointsChange?: (newPositions: LatLngExpression[]) => void;
    /** 【追加】青い点の位置が変更されたときに親コンポーネントに通知するコールバック */
    onPrimaryPointsChange?: (newPositions: LatLngExpression[]) => void;
    /** 編集可能かどうかを親から受け取るためのプロパティ */
    isEditable?: boolean;
}

/**
 * 地図の表示範囲を自動調整するコンポーネント。
 */
const MapController = ({
    positions,
    secondaryPositions,
    padding,
    maxZoom,
}: {
    positions?: LatLngExpression[];
    secondaryPositions?: LatLngExpression[];
    padding: number;
    maxZoom: number;
}) => {
    const map = useMap();

    useEffect(() => {
        const allPositions = [...(positions || []), ...(secondaryPositions || [])];
        if (allPositions.length === 0) return;

        const bounds = new LatLngBounds(allPositions);
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 依存配列を空にして、初回マウント時に一度だけ実行

    return null;
};

const RouteMapWithPoints = ({
    positions,
    secondaryPositions,
    height = 400,
    width = "100%",
    padding = 20,
    maxZoom = 16,
    interactive = true,
    showZoomControl = true,
    onPointsChange,
    onPrimaryPointsChange,
    isEditable = false,
}: RouteMapWithPointsProps) => {
    const h = typeof height === "number" ? `${height}px` : height;
    const w = typeof width === "number" ? `${width}px` : width;

    const [draggableRedPositions, setDraggableRedPositions] = useState<LatLngExpression[]>([]);
    const [draggableBluePositions, setDraggableBluePositions] = useState<LatLngExpression[]>([]);

    useEffect(() => {
        setDraggableRedPositions(secondaryPositions || []);
    }, [secondaryPositions]);

    useEffect(() => {
        setDraggableBluePositions(positions || []);
    }, [positions]);

    const handleRedMarkerDragEnd = (e: LeafletEvent, index: number) => {
        const { lat, lng } = e.target.getLatLng();
        const newPositions = [...draggableRedPositions];
        newPositions[index] = [lat, lng];
        setDraggableRedPositions(newPositions);
        if (onPointsChange) {
            onPointsChange(newPositions);
        }
    };

    const handleBlueMarkerDragEnd = (e: LeafletEvent, index: number) => {
        const { lat, lng } = e.target.getLatLng();
        const newPositions = [...draggableBluePositions];
        newPositions[index] = [lat, lng];
        setDraggableBluePositions(newPositions);
        if (onPrimaryPointsChange) {
            onPrimaryPointsChange(newPositions);
        }
    };

    const startIcon = useMemo(() => divIcon({
        html: `<div style="background-color:#4A90E2;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">S</div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    }), []);

    const blueDotIcon = useMemo(() => divIcon({
        html: `<div style="background-color:#4A90E2; border-radius:50%; width:14px; height:14px; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); cursor: grab;"></div>`,
        className: 'blue-dot-icon',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    }), []);

    const startPosition = positions?.[0] || secondaryPositions?.[0];

    return (
        <MapContainer
            style={{ height: h, width: w }}
            attributionControl={false}
            zoomControl={showZoomControl}
            dragging={interactive}
            touchZoom={interactive}
            doubleClickZoom={interactive}
            scrollWheelZoom={interactive}
            keyboard={interactive}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* drawing_points: 赤い線 */}
            {draggableRedPositions.length > 0 && (
                <Polyline positions={draggableRedPositions} color="red" weight={3} />
            )}

            {/* route_points: 水色の線（グラデーション風）とドラッグ可能な点 */}
            {draggableBluePositions.length > 0 && (
                <>
                    <Polyline positions={draggableBluePositions} color="#1E40CF" weight={8} opacity={0.6} />
                    <Polyline positions={draggableBluePositions} color="#07D8F9" weight={4} opacity={0.9} />

                    {/* isEditableがtrueの場合のみ、青い点をレンダリングする */}
                    {isEditable && draggableBluePositions.map((pos, idx) => (
                        <Marker
                            key={`blue-marker-${idx}`}
                            position={pos}
                            icon={blueDotIcon}
                            draggable={isEditable}
                            eventHandlers={{
                                dragend: (e) => handleBlueMarkerDragEnd(e, idx),
                            }}
                        />
                    ))}
                </>
            )}

            {/* スタートマーカー */}
            {startPosition && <Marker position={startPosition} icon={startIcon} />}

            {/* 地図の表示範囲を制御するコンポーネント */}
            <MapController
                positions={positions}
                secondaryPositions={secondaryPositions}
                padding={padding}
                maxZoom={maxZoom}
            />
        </MapContainer>
    );
};

export default RouteMapWithPoints;