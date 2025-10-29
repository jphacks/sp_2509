// frontend/src/components/Carousel.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

// --- 型定義 ---
export type CarouselItem = {
  src: string;
  alt: string;
  description: string;
};

type CarouselProps = {
  items: CarouselItem[];
  imageBorderRadius?: string;
  textClassName?: string;
};

const imageWidth = 200;
const imageHeight = 200;

export default function Carousel({
  items,
  imageBorderRadius = "rounded-lg",
  textClassName = "text-white",
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const isDraggingRef = useRef(false);

  // --- ドラッグ中の pointer move ---
  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const deltaX = e.movementX ?? 0;
    scrollContainerRef.current.scrollLeft -= deltaX;
  }, []);

  // --- ドラッグ終了 ---
  const handleGlobalPointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    }
  }, [handleGlobalPointerMove]);

  // --- ドラッグ開始 ---
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;

    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;

    const rect = scrollContainerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    setStartX(currentX);

    // ネイティブ PointerEvent での動き
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
  };

  // --- クリーンアップ ---
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  // --- クリック防止（ドラッグ判定用） ---
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    const currentX =
      e.clientX - scrollContainerRef.current.getBoundingClientRect().left;
    const movedDistance = Math.abs(currentX - startX);
    if (movedDistance > 2) e.stopPropagation();
  };

  return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto scrollbar-hide cursor-grab ${
          isDragging ? "cursor-grabbing" : ""
        } gap-4 px-4`}
        onPointerDown={onPointerDown}
        onClickCapture={handleClickCapture}
        style={{ userSelect: "none" }}
      >
        {items.map((item, index) => (
          <div
            key={item.src}
            className={`relative flex-shrink-0 overflow-hidden ${imageBorderRadius}`}
            style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              style={{ userSelect: "none" }}
            />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            <div
              className={`absolute bottom-0 left-0 w-full p-2 text-left ${textClassName} pointer-events-none`}
            >
              <p className="font-bold text-lg">{index + 1}</p>
              <p className="text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
