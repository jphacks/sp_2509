// frontend/src/components/RouteMapWithPoints.tsx
"use client";

import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, divIcon, LatLngBounds, LeafletEvent } from "leaflet";
import { useEffect, useState, useMemo } from "react";

type CSSSize = number | string;

interface RouteMapProps {
    /** route_points用の座標（青い線） */
    positions?: LatLngExpression[];
    /** drawing_points用の座標（赤い線）。これがドラッグ可能になります */
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
    /** 点の位置が変更されたときに親コンポーネントに通知するコールバック */
    onPointsChange?: (newPositions: LatLngExpression[]) => void;
}

/**
 * 地図の表示範囲を自動調整するコンポーネント。
 * ドラッグによる座標更新では再調整が走らないように、依存関係を工夫しています。
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
    }, [map, positions, padding, maxZoom, JSON.stringify(secondaryPositions)]);
    // secondaryPositions は文字列化して渡すことで、参照ではなく値の変更時のみeffectが実行されるようにする

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
}: RouteMapProps) => {
    const h = typeof height === "number" ? `${height}px` : height;
    const w = typeof width === "number" ? `${width}px` : width;

    // ドラッグ可能な点の位置情報を内部で管理するState
    const [draggablePositions, setDraggablePositions] = useState<LatLngExpression[]>([]);

    // propsとして渡された座標が変更されたら、内部のStateも更新する
    useEffect(() => {
        setDraggablePositions(secondaryPositions || []);
    }, [secondaryPositions]);

    // マーカーのドラッグ終了時のイベントハンドラ
    const handleMarkerDragEnd = (e: LeafletEvent, index: number) => {
        const { lat, lng } = e.target.getLatLng();
        const newPositions = [...draggablePositions];
        newPositions[index] = [lat, lng];
        setDraggablePositions(newPositions);
        // 親コンポーネントに変更を通知
        if (onPointsChange) {
            onPointsChange(newPositions);
        }
    };

    // スタート地点のマーカーアイコン
    const startIcon = useMemo(() => divIcon({
        html: `<div style="background-color:#4A90E2;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">S</div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    }), []);

    // ドラッグ可能な赤い点のアイコン
    const redDotIcon = useMemo(() => divIcon({
        html: `<div style="background-color:red; border-radius:50%; width:14px; height:14px; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); cursor: grab;"></div>`,
        className: 'red-dot-icon',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    }), []);

    const startPosition = positions?.[0] || draggablePositions?.[0];

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
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* drawing_points: 赤い線とドラッグ可能な点 */}
            {draggablePositions && draggablePositions.length > 0 && (
                <>
                    <Polyline positions={draggablePositions} color="red" weight={3} />
                    {draggablePositions.map((pos, idx) => (
                        <Marker
                            key={idx}
                            position={pos}
                            icon={redDotIcon}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => handleMarkerDragEnd(e, idx),
                            }}
                        />
                    ))}
                </>
            )}

            {/* route_points: 水色の線（グラデーション風） */}
            {positions && positions.length > 0 && (
                <>
                    <Polyline positions={positions} color="#1E40CF" weight={8} opacity={0.6} />
                    <Polyline positions={positions} color="#07D8F9" weight={4} opacity={0.9} />
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