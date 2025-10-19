// frontend/src/components/DrawingCanvas.tsx
'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { Point } from '../types/types';

interface DrawingCanvasProps {
  strokeColor?: string;
  strokeWidth?: number;
  onDrawEnd?: (points: Point[]) => void;
  initialPoints?: Point[];
  clearSignal?: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokeColor = '#FF0000',
  strokeWidth = 6,
  onDrawEnd,
  initialPoints,
  clearSignal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastClearSignalRef = useRef<number | undefined>(undefined);

  const redrawInitialPoints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      setHasDrawn(true);
      if (onDrawEnd) onDrawEnd(initialPoints);
    } else {
      setHasDrawn(false);
    }
  }, [initialPoints, strokeColor, strokeWidth, onDrawEnd]);

  // ★★★ Canvasのサイズとスケールを再設定する関数 ★★★
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // サイズ変更後に既存の描画を再描画する
    // （今回は initialPoints のみ再描画）
    redrawInitialPoints();
  }, [redrawInitialPoints]);


  // ★★★ useLayoutEffectからuseEffectに変更し、ResizeObserverをセット ★★★
  useEffect(() => {
    handleResize(); // 初回実行

    const container = containerRef.current;
    if (!container) return;

    // 親要素のサイズ変更を監視
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // クリーンアップ関数
    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);


  const performClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // scaleを考慮せずにクリアするために一度リセット
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); // 元のscaleに戻す

    setPoints([]);
    setHasDrawn(false);
    setIsDrawing(false);
    if (onDrawEnd) {
      onDrawEnd([]);
    }
  }, [onDrawEnd]);

  useEffect(() => {
    if (clearSignal === undefined) return;
    if (lastClearSignalRef.current === undefined) {
      lastClearSignalRef.current = clearSignal;
      return;
    }
    if (clearSignal !== lastClearSignalRef.current) {
      performClear();
      lastClearSignalRef.current = clearSignal;
    }
  }, [clearSignal, performClear]);

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in event) {
      if (event.touches.length === 0) return null;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (hasDrawn) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    // 新規描画の前にクリア
    performClear();

    const coords = getCoordinates(event);
    if (!coords) return;
    setIsDrawing(true);
    setPoints([coords]);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    //if ('touches' in event) event.preventDefault();
  }, [strokeColor, strokeWidth, hasDrawn, performClear]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();

    if (points.length > 1) {
      setHasDrawn(true);
      if (onDrawEnd) onDrawEnd(points);
    } else {
      performClear();
    }
  }, [isDrawing, onDrawEnd, points, performClear]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || hasDrawn) return;
    if ('buttons' in event && event.buttons !== 1) {
        // マウスボタンが押されていなければ終了
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
    //if ('touches' in event) event.preventDefault();
  }, [isDrawing, hasDrawn, stopDrawing]); // stopDrawingを依存配列に追加

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {!isDrawing && !hasDrawn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-4 z-10">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <FaPencilAlt className="text-gray-500 text-4xl" />
          </div>
          <span className="text-gray-500 text-center px-4">
            画面をタッチして
            <br />
            一筆書きで絵を描いてください
          </span>
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
          hasDrawn ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default DrawingCanvas;

