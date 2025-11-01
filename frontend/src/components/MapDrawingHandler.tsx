// frontend/src/components/MapDrawingHandler.tsx
'use client';

import { useState, useRef } from 'react';
import { Polyline, useMapEvents } from 'react-leaflet';
// ★ 修正: LeafletMouseEvent を型インポートに追加
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';

interface MapDrawingHandlerProps {
    isDrawingMode: boolean;
    onDrawEnd: (points: LatLngExpression[]) => void;
    strokeColor?: string;
}

export default function MapDrawingHandler({
    isDrawingMode,
    onDrawEnd,
    strokeColor = '#f4541fff', // DrawingCanvas と同じ赤色
}: MapDrawingHandlerProps) {
    const [points, setPoints] = useState<LatLngExpression[]>([]);
    const isDrawingRef = useRef(false);

    useMapEvents({
        // ★ 修正: e に LeafletMouseEvent 型を指定
        // mousedown は PC のクリックとスマートフォンのタップ(touchstart)の両方に対応します
        mousedown(e: LeafletMouseEvent) {
            if (!isDrawingMode) return;
            isDrawingRef.current = true;
            setPoints([e.latlng]); // 新しい描画を開始
        },
        // ★ 修正: e に LeafletMouseEvent 型を指定
        // mousemove は PC のドラッグとスマートフォンのスワイプ(touchmove)の両方に対応します
        mousemove(e: LeafletMouseEvent) {
            if (!isDrawingMode || !isDrawingRef.current) return;
            setPoints((prev) => [...prev, e.latlng]); // 座標を追加
        },
        // ★ 修正: e に LeafletMouseEvent 型を指定
        // mouseup は PC のリリースとスマートフォンのリリース(touchend)の両方に対応します
        mouseup(e: LeafletMouseEvent) {
            if (!isDrawingMode || !isDrawingRef.current) return;
            isDrawingRef.current = false;
            if (points.length > 1) {
                onDrawEnd(points); // 描画完了を通知
            }
            setPoints([]); // 一時的な描画線をクリア
        },
    });

    // ユーザーが現在描画中の線をリアルタイムで表示
    return points.length > 0 ? (
        <Polyline
            positions={points}
            color={strokeColor}
            weight={5}
            opacity={0.7}
        />
    ) : null;
}