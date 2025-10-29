// frontend/src/components/CarouselWithClick.tsx
"use client";

import { useRef, useState, MouseEvent } from 'react';
import Image from 'next/image';
import type { Point } from '../types/types';

export type CarouselClickItem = {
  src: string;
  alt: string;
  description: string;
  onClick?: () => void;
  shapeData?: Point[];
};

type CarouselWithClickProps = {
  items: CarouselClickItem[];
  imageBorderRadius?: string;
  textClassName?: string;
  selectedDescription?: string | null;
};

const imageWidth = 125;
const imageHeight = 125;
const gap = 16;

export default function CarouselWithClick({
  items,
  imageBorderRadius = 'rounded-lg',
  textClassName = 'text-black',
  selectedDescription,
}: CarouselWithClickProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ドラッグ関連の関数 (変更なし)
  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // ボタン要素上でのドラッグ開始を防ぐ
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    if (scrollContainerRef.current) {
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };
  const onMouseLeave = () => { if (isDragging) setIsDragging(false); };
  const onMouseUp = () => { if (isDragging) setIsDragging(false); };
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // スクロール感度調整
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // クリック処理（ドラッグ中は発火させない）
  const handleItemClick = (itemOnClick: (() => void) | undefined, e: MouseEvent<HTMLButtonElement>) => {
    // ドラッグ操作による意図しないクリックを防ぐ簡易的なチェック
    // より厳密にする場合は、マウスダウン/アップ間の移動距離を見るなどの方法がある
    if (isDragging) {
      e.stopPropagation(); // イベントの伝播を止める
      return;
    }
    if (itemOnClick) itemOnClick();
  };


return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab py-4 ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ gap: `${gap}px`, paddingLeft: `${gap}px`, paddingRight: `${gap}px` }}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {items.map((item, index) => {
          const isSelected = item.description === selectedDescription;
          const isDimmed = selectedDescription != null && !isSelected;

          return (
            <button
              key={index}
              onClick={(e) => handleItemClick(item.onClick, e)}
              className={`
                relative flex-shrink-0 snap-start overflow-hidden focus:outline-none transition-all duration-150 ease-in-out
                ${imageBorderRadius}
                ${isSelected
                  ? 'ring-offset-2 scale-120'
                  : 'hover:scale-105'
                }
              `}
              style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={imageWidth}
                height={imageHeight}
                className="w-full h-full object-cover pointer-events-none"
              />
              {/* ★★★ 修正箇所: オーバーレイにtransitionを追加 ★★★ */}
              {/* オーバーレイを常にレンダリングし、透明度で表示/非表示を制御 */}
              <div
                className={`
                  absolute inset-0 w-full h-full
                  bg-gray-300 // グレーの色自体は常に設定
                  mix-blend-multiply
                  ${imageBorderRadius}
                  pointer-events-none
                  transition-opacity duration-150 ease-in-out // ★ 透明度のトランジションを追加
                  ${isDimmed
                    ? 'bg-opacity-30 hover:bg-opacity-10' // ★ 暗くする場合の透明度
                    : 'bg-opacity-0' // ★ 暗くしない場合は完全に透明
                  }
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}