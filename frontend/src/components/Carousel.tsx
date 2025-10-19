"use client";

import { useRef, useState, MouseEvent } from 'react';
import Image from 'next/image';

type CarouselItem = {
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
const gap = 16; // 画像間の余白 (px)

export default function Carousel({
  items,
  // 画像の角丸
  // 例: 'rounded-md', 'rounded-xl', 'rounded-2xl', 'rounded-full'
  imageBorderRadius = 'rounded-lg',
  // テキスト全体のスタイル (Tailwind CSSクラス)
  // 例: 'font-sans text-yellow-300'
  textClassName = 'text-white',
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (scrollContainerRef.current) {
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // スクロール速度を調整
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab ${isDragging ? 'cursor-grabbing' : ''} gap-4 px-4 scroll-px-4`}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`relative flex-shrink-0 snap-start overflow-hidden ${imageBorderRadius}`}
            style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
            <div className={`absolute bottom-0 left-0 w-full p-2 text-left ${textClassName}`}>
              <p className="font-bold text-lg">{index + 1}</p> {/* 画像の番号. font-bold text-lgで少し大きく */}
              <p className="text-sm">{item.description}</p> {/* 画像の説明文. text-smで少し小さく */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
