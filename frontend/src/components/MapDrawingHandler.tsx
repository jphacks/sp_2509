// frontend/src/components/MapDrawingHandler.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Polyline, useMap } from "react-leaflet";
import * as L from "leaflet"; // 互換性のためワイルドカード import
import type { LatLngExpression, LatLng } from "leaflet";

interface MapDrawingHandlerProps {
    /** 描画モード（true の間のみ描ける） */
    isDrawingMode: boolean;
    /** 描画完了時に返す LatLng の配列 */
    onDrawEnd: (points: LatLngExpression[]) => void;
    /** ライブ表示の線色 */
    strokeColor?: string;
    /** 何 m 以上動いたら点を追加するか（負荷対策） */
    sampleMinDistM?: number;
}

type Pt = { lat: number; lng: number };
const toRad = (d: number) => (d * Math.PI) / 180;
function haversineM(a: Pt, b: Pt) {
    const R = 6371e3;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function MapDrawingHandler({
    isDrawingMode,
    onDrawEnd,
    strokeColor = "#f4541f",
    sampleMinDistM = 2,
}: MapDrawingHandlerProps) {
    const map = useMap();

    // ライブ表示用の state（Polyline 用）
    const [points, setPoints] = useState<LatLngExpression[]>([]);

    // 実処理向けの参照（イベントハンドラから最新配列にアクセスするため）
    const pointsRef = useRef<LatLngExpression[]>([]);
    const drawingRef = useRef(false);
    const activePointerId = useRef<number | null>(null);

    // state と ref を同期
    const setPointsSafe = (updater: (prev: LatLngExpression[]) => LatLngExpression[]) => {
        setPoints((prev) => {
            const next = updater(prev);
            pointsRef.current = next;
            return next;
        });
    };

    // 末尾点（m サンプリング用）
    const lastPt = (): Pt | undefined => {
        const p = pointsRef.current[pointsRef.current.length - 1] as LatLng | undefined;
        return p ? { lat: p.lat, lng: p.lng } : undefined;
    };

    // すべてのイベントから安全に LatLng を得る
    function eventToLatLng(ev: Event): L.LatLng | null {
        const container = map.getContainer();
        const rect = container.getBoundingClientRect();

        // Pointer/Mouse としてのプロパティ
        const pe = ev as PointerEvent & MouseEvent;
        // Touch としてのプロパティ
        const te = ev as TouchEvent;

        let clientX: number | undefined;
        let clientY: number | undefined;

        if (typeof pe.clientX === "number" && typeof pe.clientY === "number") {
            clientX = pe.clientX;
            clientY = pe.clientY;
        } else if (te?.touches && te.touches.length > 0) {
            clientX = te.touches[0].clientX;
            clientY = te.touches[0].clientY;
        } else if (te?.changedTouches && te.changedTouches.length > 0) {
            clientX = te.changedTouches[0].clientX;
            clientY = te.changedTouches[0].clientY;
        }

        if (
            clientX === undefined ||
            clientY === undefined ||
            Number.isNaN(clientX) ||
            Number.isNaN(clientY)
        ) {
            return null; // NaN 予防
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return map.containerPointToLatLng(L.point(x, y));
    }

    useEffect(() => {
        const container = map.getContainer();

        const onPointerDown = (e: PointerEvent) => {
            if (!isDrawingMode) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;

            drawingRef.current = true;
            activePointerId.current = e.pointerId;

            setPointsSafe(() => [latlng]);

            // スクロール/ドラッグ抑止
            try {
                (e.target as Element).setPointerCapture?.(e.pointerId);
            } catch { }
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDrawingMode || !drawingRef.current) return;
            if (
                activePointerId.current !== null &&
                e.pointerId !== activePointerId.current
            )
                return;

            const latlng = eventToLatLng(e);
            if (!latlng) return;

            const prev = lastPt();
            const cur = { lat: latlng.lat, lng: latlng.lng };
            if (!prev || haversineM(prev, cur) >= sampleMinDistM) {
                setPointsSafe((arr) => [...arr, latlng]);
            }

            e.preventDefault();
            e.stopPropagation();
        };

        const finish = (e?: PointerEvent | TouchEvent | MouseEvent) => {
            if (!isDrawingMode || !drawingRef.current) return;
            drawingRef.current = false;
            activePointerId.current = null;

            const list = pointsRef.current;
            if (list.length > 1) onDrawEnd(list);

            // リセット
            setPointsSafe(() => []);
            if (e && "pointerId" in e) {
                try {
                    (e.target as Element).releasePointerCapture?.(e.pointerId as number);
                } catch { }
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            finish(e);
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerCancel = (e: PointerEvent) => {
            finish(e);
        };

        // フォールバック（旧端末向け）
        const onTouchStart = (e: TouchEvent) => {
            if (!isDrawingMode || drawingRef.current) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;

            drawingRef.current = true;
            setPointsSafe(() => [latlng]);
            e.preventDefault();
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDrawingMode || !drawingRef.current) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;

            const prev = lastPt();
            const cur = { lat: latlng.lat, lng: latlng.lng };
            if (!prev || haversineM(prev, cur) >= sampleMinDistM) {
                setPointsSafe((arr) => [...arr, latlng]);
            }
            e.preventDefault();
        };
        const onTouchEnd = (e: TouchEvent) => finish(e);

        const onMouseDown = (e: MouseEvent) => {
            if (!isDrawingMode) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;

            drawingRef.current = true;
            setPointsSafe(() => [latlng]);
            e.preventDefault();
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDrawingMode || !drawingRef.current) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;

            const prev = lastPt();
            const cur = { lat: latlng.lat, lng: latlng.lng };
            if (!prev || haversineM(prev, cur) >= sampleMinDistM) {
                setPointsSafe((arr) => [...arr, latlng]);
            }
            e.preventDefault();
        };
        const onMouseUp = (e: MouseEvent) => finish(e);

        // Pointer を主、他は保険。passive:false で preventDefault を有効化
        container.addEventListener("pointerdown", onPointerDown, { passive: false });
        container.addEventListener("pointermove", onPointerMove, { passive: false });
        container.addEventListener("pointerup", onPointerUp, { passive: false });
        container.addEventListener("pointercancel", onPointerCancel, { passive: false });

        container.addEventListener("touchstart", onTouchStart, { passive: false });
        container.addEventListener("touchmove", onTouchMove, { passive: false });
        container.addEventListener("touchend", onTouchEnd, { passive: false });

        container.addEventListener("mousedown", onMouseDown, { passive: false });
        container.addEventListener("mousemove", onMouseMove, { passive: false });
        container.addEventListener("mouseup", onMouseUp, { passive: false });

        return () => {
            container.removeEventListener("pointerdown", onPointerDown as any);
            container.removeEventListener("pointermove", onPointerMove as any);
            container.removeEventListener("pointerup", onPointerUp as any);
            container.removeEventListener("pointercancel", onPointerCancel as any);

            container.removeEventListener("touchstart", onTouchStart as any);
            container.removeEventListener("touchmove", onTouchMove as any);
            container.removeEventListener("touchend", onTouchEnd as any);

            container.removeEventListener("mousedown", onMouseDown as any);
            container.removeEventListener("mousemove", onMouseMove as any);
            container.removeEventListener("mouseup", onMouseUp as any);
        };
    }, [isDrawingMode, map, onDrawEnd, sampleMinDistM]);

    // ライブ描画（描画中のみ表示）
    return points.length > 0 ? (
        <Polyline positions={points} color={strokeColor} weight={5} opacity={0.7} />
    ) : null;
}
