// frontend/src/components/DrawingCanvas.tsx
'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { Point } from '../types/types';
import Text from './Text'; // ★ 追加
import { ACCENT_AMBER } from '../lib/color'; // ★ 追加

interface DrawingCanvasProps {
  strokeColor?: string;
  strokeWidth?: number;
  onDrawEnd?: (points: Point[]) => void;
  initialPoints?: Point[];
  clearSignal?: number;
  showGuideText?: boolean; // ★ 追加: ガイドテキスト表示制御用のprop
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokeColor = ACCENT_AMBER,
  strokeWidth = 6,
  onDrawEnd,
  initialPoints,
  clearSignal,
  showGuideText = true, // ★ 追加: デフォルトは表示する
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hasContent, setHasContent] = useState(false);
  const lastClearSignalRef = useRef<number | undefined>(undefined);

  // initialPoints が与えられたときの処理 (変更なし)
  const redrawInitialPoints = useCallback(() => {
    // ... (redrawInitialPoints の中身は変更なし) ...
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (initialPoints && initialPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(initialPoints[0].x, initialPoints[0].y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      initialPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.closePath();
      setPoints(initialPoints);
      setHasContent(true);
      if (onDrawEnd) onDrawEnd(initialPoints);
    } else {
      setHasContent(false);
    }
  }, [initialPoints, strokeColor, strokeWidth, onDrawEnd]);

  // Canvasのリサイズ処理 (変更なし)
  const handleResize = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.scale(dpr, dpr); }
      redrawInitialPoints();
  }, [redrawInitialPoints]);


  useEffect(() => {
    handleResize();
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => { handleResize(); });
    resizeObserver.observe(container);
    return () => { resizeObserver.disconnect(); };
  }, [handleResize]);


  // クリア処理 (変更なし)
  const performClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setPoints([]);
    setHasContent(false);
    setIsDrawing(false);
    if (onDrawEnd) {
      onDrawEnd([]);
    }
  }, [onDrawEnd]);

  // clearSignal の監視 (変更なし)
  useEffect(() => {
    const firstRender = lastClearSignalRef.current === undefined;
    if (clearSignal === undefined) {
        if(firstRender) redrawInitialPoints();
        return;
    };
    if (firstRender) {
        lastClearSignalRef.current = clearSignal;
        redrawInitialPoints();
        return;
    }
    if (clearSignal !== lastClearSignalRef.current) {
      console.log('DrawingCanvas: clearSignal received, performing clear.');
      performClear();
      lastClearSignalRef.current = clearSignal;
    }
  }, [clearSignal, performClear, redrawInitialPoints]);

  // 座標取得関数 (変更なし)
  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in event) {
        if (event.touches.length === 0) return null;
        clientX = event.touches[0].clientX; clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX; clientY = event.clientY;
      }
      const x = clientX - rect.left; const y = clientY - rect.top;
      return { x, y };
  };

  // 描画開始処理 (変更なし)
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (hasContent) {
        console.log('DrawingCanvas: Canvas already has content or initial points.');
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
        console.error('DrawingCanvas: Canvas element not found.');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('DrawingCanvas: Failed to get 2D context.');
        return;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setPoints([]);

    const coords = getCoordinates(event);
    if (!coords) return;
    console.log('DrawingCanvas: startDrawing');
    setIsDrawing(true);
    setPoints([coords]);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if ('touches' in event) event.preventDefault();
  }, [hasContent, strokeColor, strokeWidth]);

  // 描画終了処理 (変更なし)
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    console.log('DrawingCanvas: stopDrawing');
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
    if (points.length > 1) {
      setHasContent(true);
      if (onDrawEnd) onDrawEnd(points);
    } else {
      performClear();
    }
  }, [isDrawing, onDrawEnd, points, performClear]);

  // 描画中処理 (変更なし)
  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('buttons' in event && event.buttons !== 1 && event.type.startsWith('mouse')) {
        console.log('DrawingCanvas: Mouse button released during draw, stopping.');
        stopDrawing();
        return;
    }
    const coords = getCoordinates(event);
    if (!coords) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setPoints(prevPoints => [...prevPoints, coords]);
    }
    if ('touches' in event) event.preventDefault();
  }, [isDrawing, stopDrawing]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* ★ 条件を変更: showGuideText が true の場合のみ表示 */}
      {showGuideText && !isDrawing && !hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-2 z-10">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <FaPencilAlt className="text-gray-500 text-4xl" />
          </div>
          <Text text="おすすめを選ぶか" />
          <Text text="一筆書きで絵を描いてください" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className={`touch-none bg-white rounded-lg shadow-md block w-full h-full ${
          hasContent ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'
        }`}
      />
    </div>
  );
};

export default DrawingCanvas;