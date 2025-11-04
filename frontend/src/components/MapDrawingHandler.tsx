"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Polyline, useMap } from "react-leaflet";
import * as L from "leaflet";
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
    /** 描画状態とタッチ本数の通知（地図側の挙動切替用・任意） */
    onDrawingStateChange?: (s: { drawing: boolean; touchCount: number }) => void;
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
    onDrawingStateChange,
}: MapDrawingHandlerProps) {
    const map = useMap();

    const [points, setPoints] = useState<LatLngExpression[]>([]);
    const pointsRef = useRef<LatLngExpression[]>([]);
    const drawingRef = useRef(false);
    const activePointerId = useRef<number | null>(null);
    const activeTouchIds = useRef<Set<number>>(new Set());

    /** points の state/ref 同期（安定参照） */
    const setPointsSafe = useCallback(
        (updater: (prev: LatLngExpression[]) => LatLngExpression[]) => {
            setPoints((prev) => {
                const next = updater(prev);
                pointsRef.current = next;
                return next;
            });
        },
        []
    );

    /** 通知関数（useCallback で安定化） */
    const notify = useCallback(() => {
        onDrawingStateChange?.({
            drawing: drawingRef.current,
            touchCount: activeTouchIds.current.size,
        });
    }, [onDrawingStateChange]);

    /** タッチID管理（useCallback で関数化） */
    const addTouch = useCallback((id: number) => {
        activeTouchIds.current.add(id);
        notify();
    }, [notify]);

    const removeTouch = useCallback((id: number) => {
        activeTouchIds.current.delete(id);
        notify();
    }, [notify]);

    const getTouchCount = useCallback(() => activeTouchIds.current.size, []);

    const lastPt = useCallback((): Pt | undefined => {
        const p = pointsRef.current[pointsRef.current.length - 1] as LatLng | undefined;
        return p ? { lat: p.lat, lng: p.lng } : undefined;
    }, []);

    /** 画面座標→LatLng 変換（安定化） */
    const eventToLatLng = useCallback(
        (ev: Event): L.LatLng | null => {
            const container = map.getContainer();
            const rect = container.getBoundingClientRect();
            const pe = ev as PointerEvent & MouseEvent;
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
            )
                return null;

            const x = clientX - rect.left;
            const y = clientY - rect.top;
            return map.containerPointToLatLng(L.point(x, y));
        },
        [map]
    );

    /** 描画開始/中断/完了（useCallback 化） */
    const beginDrawing = useCallback((pid?: number, latlng?: L.LatLng) => {
        if (pid !== undefined) activePointerId.current = pid;
        drawingRef.current = true;
        if (latlng) setPointsSafe(() => [latlng]);
        notify();
    }, [notify, setPointsSafe]);

    const cancelDrawing = useCallback(() => {
        drawingRef.current = false;
        activePointerId.current = null;
        setPointsSafe(() => []);
        notify();
    }, [notify, setPointsSafe]);

    const finishDrawing = useCallback(
        (e?: PointerEvent | TouchEvent | MouseEvent) => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            const list = pointsRef.current;
            if (list.length > 1) onDrawEnd(list);
            setPointsSafe(() => []);
            activePointerId.current = null;
            if (e && "pointerId" in e) {
                try {
                    (e.target as Element).releasePointerCapture?.(e.pointerId as number);
                } catch { }
            }
            notify();
        },
        [notify, onDrawEnd, setPointsSafe]
    );

    useEffect(() => {
        const container = map.getContainer();

        const onPointerDown = (e: PointerEvent) => {
            if (!isDrawingMode) return;

            if (e.pointerType === "touch") addTouch(e.pointerId);

            // 2本指以上 ⇒ 地図操作に譲る
            if (e.pointerType === "touch" && getTouchCount() >= 2) return;

            const latlng = eventToLatLng(e);
            if (!latlng) return;

            beginDrawing(e.pointerId, latlng);
            try {
                (e.target as Element).setPointerCapture?.(e.pointerId);
            } catch { }
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDrawingMode) return;

            // 描画中に2本指になったら中断して地図へ
            if (drawingRef.current && e.pointerType === "touch" && getTouchCount() >= 2) {
                cancelDrawing();
                return;
            }

            if (
                drawingRef.current &&
                (activePointerId.current === null || e.pointerId === activePointerId.current)
            ) {
                const latlng = eventToLatLng(e);
                if (!latlng) return;

                const prev = lastPt();
                const cur = { lat: latlng.lat, lng: latlng.lng };
                if (!prev || haversineM(prev, cur) >= sampleMinDistM) {
                    setPointsSafe((arr) => [...arr, latlng]);
                }
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            if (e.pointerType === "touch") removeTouch(e.pointerId);
            if (activePointerId.current === e.pointerId) {
                finishDrawing(e);
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const onPointerCancel = (e: PointerEvent) => {
            if (e.pointerType === "touch") removeTouch(e.pointerId);
            if (activePointerId.current === e.pointerId) cancelDrawing();
        };

        // Touch Events（保険）
        const onTouchStart = (e: TouchEvent) => {
            if (!isDrawingMode) return;
            if (e.touches.length >= 2) {
                notify();
                return;
            }
            if (drawingRef.current) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;
            beginDrawing(undefined, latlng);
            e.preventDefault();
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDrawingMode) return;
            if (e.touches.length >= 2) {
                cancelDrawing();
                return;
            }
            if (!drawingRef.current) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;
            const prev = lastPt();
            const cur = { lat: latlng.lat, lng: latlng.lng };
            if (!prev || haversineM(prev, cur) >= sampleMinDistM) {
                setPointsSafe((arr) => [...arr, latlng]);
            }
            e.preventDefault();
        };
        const onTouchEnd = () => finishDrawing();

        // Mouse（PC）
        const onMouseDown = (e: MouseEvent) => {
            if (!isDrawingMode) return;
            const latlng = eventToLatLng(e);
            if (!latlng) return;
            beginDrawing(undefined, latlng);
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
        const onMouseUp = () => finishDrawing();

        // 監視開始
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
    }, [
        map,
        isDrawingMode,
        sampleMinDistM,
        // 安定化した関数のみ依存
        addTouch,
        removeTouch,
        getTouchCount,
        eventToLatLng,
        beginDrawing,
        cancelDrawing,
        finishDrawing,
        lastPt,
        setPointsSafe,
    ]);

    return points.length > 0 ? (
        <Polyline positions={points} color={strokeColor} weight={5} opacity={0.7} />
    ) : null;
}
