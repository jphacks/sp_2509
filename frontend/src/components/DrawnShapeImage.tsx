'use client';

import React, { useRef, useEffect } from 'react';
import type { Point } from '../types/types';

interface DrawnShapeImageProps {
  points: Point[];
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  padding?: number;
  className?: string;
}

const DrawnShapeImage: React.FC<DrawnShapeImageProps> = ({
  points,
  size = 100,
  strokeColor = '#333',
  strokeWidth = 2,
  padding = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, size, size);

    if (!points || points.length < 2) {
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const shapeWidth = maxX - minX;
    const shapeHeight = maxY - minY;

    if (shapeWidth === 0 && shapeHeight === 0) return;
    
    const availableSize = size - (padding * 2);
    // 0除算を避けるためのチェックを追加
    const scale = Math.min(
        shapeWidth > 0 ? availableSize / shapeWidth : Infinity, 
        shapeHeight > 0 ? availableSize / shapeHeight : Infinity
    );
    
    const scaledWidth = shapeWidth * scale;
    const scaledHeight = shapeHeight * scale;

    const offsetX = (size - scaledWidth) / 2;
    const offsetY = (size - scaledHeight) / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const startX = ((points[0].x - minX) * scale) + offsetX;
    const startY = ((points[0].y - minY) * scale) + offsetY;
    ctx.moveTo(startX, startY);

    for (let i = 1; i < points.length; i++) {
      const x = ((points[i].x - minX) * scale) + offsetX;
      const y = ((points[i].y - minY) * scale) + offsetY;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [points, size, strokeColor, strokeWidth, padding]);

  // ★★★ 変更点: canvasをbuttonでラップ ★★★
  return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={"bg-white rounded-xl shadow-md"}
        />
  );
  // ★★★ 変更ここまで ★★★
};

export default DrawnShapeImage;

