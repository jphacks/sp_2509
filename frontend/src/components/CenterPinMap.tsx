// components/CenterPinMap.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { startIcon } from "./MapIcons"; // ★ startIcon をインポート

type CSSSize = number | string;

type Props = {
    /** 初期中心。未指定なら geolocation（失敗時は札幌） */
    center?: [number, number];
    zoom?: number;            // default 16
    height?: CSSSize;         // default 260
    width?: CSSSize;          // default "100%"
    /** 地図中心が動く度に通知（赤ピン位置） */
    onCenterChange?: (c: [number, number]) => void;
    /** 初回fixで現在地へ寄せる（center未指定時のみ有効） */
    recenterOnFirstFix?: boolean; // default true
};

const DEFAULT_CENTER: [number, number] = [43.0621, 141.3544]; // 札幌

/** 青い現在地ピン */
const bluePinIcon = L.divIcon({
    html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md"></div>`,
    className: "",
    iconSize: [24, 24], // w-6 h-6 in tailwind is 1.5rem = 24px
    iconAnchor: [12, 12], // center of the icon
});

/** 地図中心が動くたびに親へ通知 */
function CenterReporter({
    onChange,
}: {
    onChange?: (c: [number, number]) => void;
}) {
    const map = useMapEvents({
        move: () => {
            const c = map.getCenter();
            onChange?.([c.lat, c.lng]);
        },
    });

    useEffect(() => {
        const c = map.getCenter();
        onChange?.([c.lat, c.lng]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

/** 初回のみ与えた座標へ視点を寄せる */
function RecenterOnce({ lat, lng }: { lat: number; lng: number }) {
    const doneRef = useRef(false);
    const map = useMap();
    useEffect(() => {
        if (doneRef.current) return;
        map.setView([lat, lng]);
        doneRef.current = true;
    }, [lat, lng, map]);
    return null;
}

export default function CenterPinMap({
    center,
    zoom = 16,
    height = 260,
    width = "100%",
    onCenterChange,
    recenterOnFirstFix = true,
}: Props) {
    const [userPos, setUserPos] = useState<[number, number] | null>(
        center ?? null
    );
    const [ready, setReady] = useState<boolean>(!!center);

    // 初期中心未指定→ geolocation で取得
    useEffect(() => {
        if (center) {
            setUserPos(center);
            setReady(true);
            return;
        }
        if (!("geolocation" in navigator)) {
            setUserPos(DEFAULT_CENTER);
            setReady(true);
            return;
        }
        const id = navigator.geolocation.watchPosition(
            (p) => {
                const nxt: [number, number] = [p.coords.latitude, p.coords.longitude];
                setUserPos(nxt);
                setReady(true);
            },
            () => {
                setUserPos(DEFAULT_CENTER);
                setReady(true);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
        );
        return () => navigator.geolocation.clearWatch(id);
    }, [center]);

    const style: React.CSSProperties = useMemo(
        () => ({
            height: typeof height === "number" ? `${height}px` : height,
            width: typeof width === "number" ? `${width}px` : width,
        }),
        [height, width]
    );

    if (!ready || !userPos) {
        return (
            <div
                style={style}
                className="relative flex items-center justify-center rounded-md bg-gray-100 text-gray-500"
            >
                位置情報を取得中…
            </div>
        );
    }

    const initialCenter: [number, number] = center ?? userPos;

    return (
        <div style={style} className="relative rounded-md overflow-hidden">
            {/* 背景の地図（ユーザーが動かす） */}
            <MapContainer
                center={initialCenter}
                zoom={zoom}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap &copy; CARTO"
                />

                {/* 初回fixで現在地へ寄せる（center未指定時） */}
                {!center && recenterOnFirstFix && userPos && (
                    <RecenterOnce lat={userPos[0]} lng={userPos[1]} />
                )}

                {/* 青い現在地ピン（追従） */}
                <Marker position={userPos} icon={bluePinIcon} />

                {/* 地図の中心（赤ピン位置）を通知 */}
                <CenterReporter onChange={onCenterChange} />
            </MapContainer>

            {/* ★ スタートピン：常に中央固定（オーバーレイ） ★ */}
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                {/*
                    startIcon (width 48, height 60, anchor [24, 44])
                    ピンの先端(44px)が中心(高さ60/2 = 30px)に来るように、
                    Y方向に (30 - 44) = -14px ずらす
                */}
                <div
                    className="-translate-y-[14px] drop-shadow" // ★ translate-y を変更
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: startIcon.options.html || "" }} // ★ SVGを挿入
                />
            </div>
        </div>
    );
}