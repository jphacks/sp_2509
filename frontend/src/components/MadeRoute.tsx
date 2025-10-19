// components/MadeRoute.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { BiDotsVertical } from "react-icons/bi";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

// ★ SSRでreact-leafletが評価されないようにする（window is not defined対策）
const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type MadeRouteProps = {
  /** 固有ID。削除・お気に入り更新で使用 */
  id: string;

  /** 地図上のルート座標 */
  positions?: LatLngExpression[];

  /** コース距離 (km) */
  course_distance?: number | string | null;

  /** スタート地点までの距離 (km) */
  start_distance?: number | string | null;

  /** 作成日 (ISO 文字列推奨) */
  created_at?: string;

  /** お気に入り状態（必須） */
  isFavorite: boolean;

  /** お気に入り切替時に親へ通知（newValue, id） */
  onToggleFavorite: (newValue: boolean, id: string) => void;

  /** 削除時に親へ通知（id） */
  onDelete: (id: string) => void;
};

export default function MadeRoute({
  id,
  positions,
  course_distance,
  start_distance,
  created_at,
  isFavorite,
  onToggleFavorite,
  onDelete,
}: MadeRouteProps) {
  const router = useRouter();

  // ローカルUI反映用（props 変更に追従）
  const [fav, setFav] = useState<boolean>(isFavorite);
  useEffect(() => setFav(isFavorite), [isFavorite]);

  // 三点メニュー
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  // お気に入りトグル
  const handleFav = () => {
    const next = !fav;
    setFav(next);
    if ("vibrate" in navigator) navigator.vibrate?.(10);
    onToggleFavorite(next, id);
  };

  // 三点メニューの位置計算（Portal で body 直下に描画）
  const updateMenuPosition = () => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    // 幅 160px のメニューを右端に寄せて、ボタンの少し下に表示
    setMenuPos({ top: r.bottom + 6, left: r.right - 160 });
  };

  useLayoutEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  // メニュー外クリック / Esc で閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (menuBtnRef.current && menuBtnRef.current.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // 表示用フォーマッタ
  const toNum = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  const fmtKm = (v: unknown) =>
    Number.isFinite(toNum(v)) ? toNum(v).toFixed(1) : "—";
  const dateLabel = created_at
    ? new Date(created_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "—";

  // 地図サムネ：実描画サイズは大きめ（ズームは RouteMap に任せる）
  const BASE = 480;
  const THUMB = 144;
  const SCALE = THUMB / BASE;
  const DEFAULT_PADDING = 5;
  const DEFAULT_MAX_ZOOM = 16;

  // 削除：確認→親へ通知
  const handleDelete = () => {
    setMenuOpen(false);
    const ok = window.confirm("このルートを削除しますか？");
    if (!ok) return;
    if ("vibrate" in navigator) navigator.vibrate?.(15);
    onDelete(id);
  };

  const handleCardClick = () => {
    const query: {
      [key: string]: string | number | boolean | undefined | null;
    } = {
      id,
      positions: JSON.stringify(positions),
      course_distance: course_distance,
      start_distance: start_distance,
      created_at: created_at,
      isFavorite: isFavorite,
    };

    const filteredQuery: { [key: string]: string } = {};
    for (const key in query) {
      const value = query[key];
      if (value !== undefined && value !== null) {
        filteredQuery[key] = String(value);
      }
    }

    const queryString = new URLSearchParams(filteredQuery).toString();
    router.push(`/courseDetail?${queryString}`);
  };

  return (
    <article
      className="relative rounded-2xl border border-neutral-200/70 bg-white
                 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
      aria-label="ルート概要カード"
      onClick={handleCardClick}
    >
      {/* 右上：三点メニュー */}
      <button
        ref={menuBtnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="その他の操作"
        title="その他の操作"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="absolute right-2 top-2 text-black hover:text-neutral-700
                   p-1 rounded-full hover:bg-black/5 active:scale-95 z-50
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <div className="flex flex-col items-center gap-[3px]">
          <div className="w-[4px] h-[4px] bg-current rounded-full"></div>
          <div className="w-[4px] h-[4px] bg-current rounded-full"></div>
          <div className="w-[4px] h-[4px] bg-current rounded-full"></div>
        </div>
      </button>

      {/* ドロップダウン（Portal で <body> 直下に描画） */}
      {menuOpen &&
        menuPos &&
        createPortal(
          <div
            role="menu"
            aria-label="カードの操作"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: 160,
            }}
            className="z-[1000] rounded-lg border border-neutral-200/70 bg-white shadow-lg overflow-hidden"
            // ★ 追加：メニュー内クリックが外部判定に伝播しないようにする（削除クリック無効化の根本原因対策）
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              role="menuitem"
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
            >
              削除
            </button>
          </div>,
          document.body
        )}

      {/* コンテンツ */}
      <div className="flex items-start gap-3 relative">
        {/* 左：地図サムネ（見た目だけ縮小） */}
        <div
          className="shrink-0 rounded-xl overflow-hidden ring-1 ring-black/5 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
          style={{ width: THUMB, height: THUMB }}
        >
          <div
            style={{
              width: BASE,
              height: BASE,
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          >
            <RouteMap
              positions={positions}
              width={BASE}
              height={BASE}
              padding={DEFAULT_PADDING}
              maxZoom={DEFAULT_MAX_ZOOM}
              interactive={false}
              showZoomControl={false}
            />
          </div>
        </div>

        {/* 右：テキスト（サイズ統一） */}
        <div className="flex-1 min-w-0 relative text-left">
          <div className="text-[13px] text-neutral-500">コース距離</div>
          <div className="text-[16px] font-extrabold leading-tight mt-0.5">
            {fmtKm(course_distance)}km
          </div>

          <div className="mt-2 text-[13px] text-neutral-500">
            スタート地点までの距離
          </div>
          <div className="text-[16px] font-semibold">
            {fmtKm(start_distance)}km
          </div>

          <div className="mt-2 text-[13px] text-neutral-500">作成日</div>
          <div className="text-[16px] font-semibold">{dateLabel}</div>

          {/* ⭐ 右下 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFav();
            }}
            aria-label={fav ? "お気に入り解除" : "お気に入り"}
            title={fav ? "お気に入り解除" : "お気に入り"}
            className={`absolute bottom-0 right-0 text-2xl p-1
                        ${fav ? "text-amber-500" : "text-neutral-400"}
                        hover:scale-110 active:scale-95 transition-transform
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md`}
          >
            {fav ? <AiFillStar /> : <AiOutlineStar />}
          </button>
        </div>
      </div>
    </article>
  );
}
