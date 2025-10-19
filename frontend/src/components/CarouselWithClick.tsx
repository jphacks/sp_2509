"use client";

import Carousel from "./Carousel";
import { CarouselItem } from "./Carousel"; // 必要に応じて型をexportしておく
import React from "react";

type CarouselWithClickProps = {
  items: CarouselItem[];
  onItemClick?: (item: CarouselItem, index: number) => void; // クリック時の処理を受け取る
};

export default function CarouselWithClick({
  items,
  onItemClick,
}: CarouselWithClickProps) {
  // クリック時の処理ラッパ
  const handleClick = (item: CarouselItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  // Carouselを包む（Composition）
  return (
    <div className="relative w-full">
      <Carousel
        items={items.map((item, index) => ({
          ...item,
          // 各アイテムにクリックハンドラを仕込む
          description: (
            <button
              onClick={() => handleClick(item, index)}
              className="text-left w-full text-sm hover:text-yellow-300 transition"
            >
              {item.description}
            </button>
          ) as unknown as string, // 型合わせ（Carouselがstring型を期待している場合）
        }))}
      />
    </div>
  );
}