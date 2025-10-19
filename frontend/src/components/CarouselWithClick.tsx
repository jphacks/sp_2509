// frontend/src/components/CarouselWithClick.tsx
"use client";

import { useRef, useState, MouseEvent } from 'react';
import Image from 'next/image';
import type { Point } from '../types/types'; // ★★★ Point 型をインポート ★★★

// CarouselItem 型に onClick と shapeData プロパティを追加
export type CarouselClickItem = {
  src: string;
  alt: string;
  description: string;
  onClick?: () => void; // クリック時のイベントハンドラ（オプション）
  shapeData?: Point[]; // ★★★ 図形データを格納するプロパティを追加 (オプション) ★★★
};

type CarouselWithClickProps = {
  items: CarouselClickItem[];
  imageBorderRadius?: string;
  textClassName?: string;
};

// 画像サイズの定数 (変更済み)
const imageWidth = 125;
const imageHeight = 125;
const gap = 16; // 画像間の余白 (px)

export default function CarouselWithClick({
  items,
  imageBorderRadius = 'rounded-lg',
  textClassName = 'text-black',
}: CarouselWithClickProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ドラッグ操作関連の関数
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

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const onMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // クリックイベントとドラッグイベントの区別
  const handleItemClick = (itemOnClick: (() => void) | undefined, e: MouseEvent<HTMLButtonElement>) => {
    if (isDragging) {
      e.stopPropagation();
      return;
    }
    if (itemOnClick) {
      itemOnClick();
    }
  };


  return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ gap: `${gap}px`, paddingLeft: `${gap}px`, paddingRight: `${gap}px` }}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={(e) => handleItemClick(item.onClick, e)}
            className={`relative flex-shrink-0 snap-start overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${imageBorderRadius}`}
            style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className={`absolute bottom-0 left-0 w-full p-2 text-left ${textClassName}`}>
              {/* index + 1 は不要であれば削除してもOK */}
              {/* <p className="font-bold text-lg">{index + 1}</p> */}
              <p className="text-sm font-semibold">{item.description}</p> {/* 説明文を少し強調 */}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}