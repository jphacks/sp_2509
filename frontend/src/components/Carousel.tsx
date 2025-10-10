"use client";

import { useState } from 'react';
import Image from 'next/image';

type CarouselProps = {
  images: string[];
};

export default function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };
  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative w-full mx-auto">
      <div className="overflow-hidden rounded-lg">
        {/*
          画像を横に並べるためのコンテナ
          translate-xで表示する画像を切り替える
        */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, index) => (
            <div key={index} className="flex-shrink-0 px-4 w-full">
              <Image
                src={src}
                alt={`Slide ${index + 1}`}
                width={800}
                height={600}
                className="w-full object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 前へボタン */}
      <button
        onClick={goToPrevious}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition"
        aria-label="Previous image"
      >
        &#10094;
      </button>

      {/* 次へボタン */}
      <button
        onClick={goToNext}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition"
        aria-label="Next image"
      >
        &#10095;
      </button>

      {/* インジケーター */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition ${
              currentIndex === index ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}