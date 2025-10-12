"use client";

import { useState, useRef, UIEvent } from 'react';
import Image from 'next/image';

type CarouselItem = {
  src: string;
  alt: string;
  description: string;
};

type CarouselProps = {
  items: CarouselItem[];
};

const imageWidth = 200;
const imageHeight = 200;
const gap = 16; // 画像間の余白 (px)

export default function Carousel({ items }: CarouselProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    if (scrollWidth > 0) {
      const progress = (container.scrollLeft / scrollWidth) * 100;
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }
  };

  return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ gap: `${gap}px`, paddingLeft: `${gap}px`, paddingRight: `${gap}px` }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="relative flex-shrink-0 snap-start"
            style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg" />
            <div className="absolute bottom-0 left-0 w-full p-2 text-white">
              <p className="font-bold text-lg">{index + 1}</p>
              <p className="text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* スライドバー */}
      <div className="relative w-full h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gray-800 rounded-full"
          style={{ width: '25%', transform: `translateX(${scrollProgress * 3}%)` }}
        />
      </div>
    </div>
  );
}
