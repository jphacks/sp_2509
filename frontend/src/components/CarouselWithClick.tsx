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

// ★★★ Props の型定義に selectedDescription を追加 ★★★
type CarouselWithClickProps = {
  items: CarouselClickItem[];
  imageBorderRadius?: string;
  textClassName?: string;
  selectedDescription?: string | null; // 現在選択されているアイテムの description
};

const imageWidth = 125;
const imageHeight = 125;
const gap = 16;

// ★★★ selectedDescription を Props で受け取る ★★★
export default function CarouselWithClick({
  items,
  imageBorderRadius = 'rounded-lg',
  textClassName = 'text-black',
  selectedDescription, // 追加
}: CarouselWithClickProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ドラッグ関連の関数 (変更なし)
  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
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
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleItemClick = (itemOnClick: (() => void) | undefined, e: MouseEvent<HTMLButtonElement>) => {
    if (isDragging) { e.stopPropagation(); return; }
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
          // ★★★ 現在のアイテムが選択されているかどうかのフラグ ★★★
          const isSelected = item.description === selectedDescription;

          return (
            <button
              key={index}
              onClick={(e) => handleItemClick(item.onClick, e)}
              // ★★★ 条件付きでスタイルを適用 ★★★
              className={`
                relative flex-shrink-0 snap-start overflow-hidden focus:outline-none transition-all duration-150 ease-in-out
                ${imageBorderRadius}
                ${isSelected
                  ? 'ring-offset-2 scale-120' // 選択中のスタイル
                  : 'hover:ring-gray-400' // 非選択中のスタイル
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
            </button>
          );
        })}
      </div>
    </div>
  );
}