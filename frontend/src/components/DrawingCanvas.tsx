// frontend/src/components/DrawingCanvas.tsx

'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPencilAlt } from 'react-icons/fa';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  onDrawEnd?: (points: Point[]) => void;
  initialPoints?: Point[];
  clearSignal?: number; // クリア信号を受け取るプロパティ
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = 300,
  height = 300,
  strokeColor = 'black',
  strokeWidth = 2,
  onDrawEnd,
  initialPoints,
  clearSignal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // --- 内部的なクリア処理関数 ---
  const performClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      console.log("Clearing canvas via signal..."); // デバッグ用
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPoints([]);
      setHasDrawn(false);
      setIsDrawing(false); // 念のため
      if (onDrawEnd) {
        onDrawEnd([]); // クリアしたことを通知
      }
    }
  }, [onDrawEnd]);

const lastClearSignalRef = useRef<number | undefined>(undefined);
useEffect(() => {
  if (clearSignal === undefined) return;
  // マウント直後の初回は前回値として記録するだけ（クリアしない）
  if (lastClearSignalRef.current === undefined) {
    lastClearSignalRef.current = clearSignal;
    return;
  }
  // 値が「変化した時だけ」クリアを実行
  if (clearSignal !== lastClearSignalRef.current) {
    performClear();
    lastClearSignalRef.current = clearSignal;
  }
}, [clearSignal, performClear]);

  // initialPoints（初期図形）を監視するEffect
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) return;
  if (initialPoints && initialPoints.length > 0) {
    // キャンバスを一度クリアしてから描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    onDrawEnd?.(initialPoints);
  } else {
    // initialPoints が空/undefined のときは何もしない（明示的クリアは clearSignal でやる）
  }
}, [initialPoints, strokeColor, strokeWidth, onDrawEnd]);

  // 座標取得関数 (変更なし)
  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    // ... (前のコードと同じ) ...
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

  // マウス/タッチ開始イベントハンドラ
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (hasDrawn) {
      console.log("Already drawn. Click 'Clear' to draw again."); // デバッグ用
      return;
    }


    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // 描画開始時にキャンバス全体をクリア (一筆書きのため)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const coords = getCoordinates(event);
    if (!coords) return;
    setIsDrawing(true);
    setPoints([coords]);

    // 新しい線の描画設定
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if ('touches' in event) {
      event.preventDefault();
    }
  }, [strokeColor, strokeWidth, hasDrawn]); //

  // マウス/タッチ移動イベントハンドラ (変更なし)
  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {

    if (!isDrawing || hasDrawn) return;


    if ('buttons' in event && event.buttons !== 1) {
        //stopDrawing();
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
    if ('touches' in event) {
       event.preventDefault();
    }
  }, [isDrawing, hasDrawn]); // ★ hasDrawn を依存配列に追加

  // マウス/タッチ終了イベントハンドラ
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    if (points.length > 0) {
      setHasDrawn(true);
      if (onDrawEnd) {
        onDrawEnd(points);
      }
    }
  }, [isDrawing, onDrawEnd, points]); // setHasDrawn は不要


  return (
    <div className="relative">

    {!isDrawing && !hasDrawn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-4">
          {/* アイコンのコンテナ */}
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <FaPencilAlt className="text-gray-500 text-4xl" />
          </div>
          {/* テキスト */}
          <span className="text-gray-500 text-center px-4">
            画面をタッチして
            <br />
            一筆書きで絵を描いてください
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className={`touch-none bg-white rounded-lg shadow-md ${hasDrawn ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'}${width ? ` w-[${width}px]` : ''}${height ? ` h-[${height}px]` : ''}`} // 描画済みならカーソル変更
      />
      
    </div>
  );
};

export default DrawingCanvas;