// frontend/src/components/Loading.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { Point } from '../types/types';

type LoadingProps = {
  loadingText: string;
  points?: Point[];
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  dotColor?: string;
  dotSize?: number;
  animationDuration?: number; // 描画 + 移動の時間
  pauseDuration?: number;     // フェードアウト + 停止の時間
};

// ヘルパー関数: pointsToPathData (変更なし)
const pointsToPathData = (points: Point[]): string => {
    if (!points || points.length === 0) return '';
    const margin = 10;
    const viewBoxSize = 100;
    const availableSize = viewBoxSize - margin * 2;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    const shapeWidth = maxX - minX; const shapeHeight = maxY - minY;
    // ★ 0除算を避けるためのチェックを追加 ★
    const scaleX = shapeWidth > 0 ? availableSize / shapeWidth : 1;
    const scaleY = shapeHeight > 0 ? availableSize / shapeHeight : 1;
    const scale = Math.min(scaleX, scaleY);

    // ★ isFinite チェックを追加 ★
    const effectiveScale = isFinite(scale) ? scale : 1;

    const scaledWidth = shapeWidth * effectiveScale; const scaledHeight = shapeHeight * effectiveScale;
    const offsetX = (viewBoxSize - scaledWidth) / 2; const offsetY = (viewBoxSize - scaledHeight) / 2;
    const pathCommands = points.map((p, index) => {
        const scaledX = ((p.x - minX) * effectiveScale) + offsetX;
        const scaledY = ((p.y - minY) * effectiveScale) + offsetY;
        return `${index === 0 ? 'M' : 'L'} ${scaledX.toFixed(3)} ${scaledY.toFixed(3)}`;
    });
    return pathCommands.join(' ');
};


export default function Loading({
  loadingText,
  points,
  size = 64,
  strokeColor = 'gray',
  strokeWidth = 2,
  dotColor = 'black',
  dotSize = 6,
  animationDuration = 2,
  pauseDuration = 1,
}: LoadingProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState<number>(0);
  const [pathData, setPathData] = useState<string>('');
  const pathId = "loading-path-" + Math.random().toString(36).substring(7);

  const totalDuration = animationDuration + pauseDuration;
  const activeEndKeyTime = (animationDuration / totalDuration).toFixed(3);


    useEffect(() => {
    if (points && points.length > 0) {
        const data = pointsToPathData(points);
        setPathData(data);
    } else {
        setPathData('');
        setPathLength(0);
    }
    }, [points, size]);

    // pathData が確定したあとに pathLength を取得
useEffect(() => {
  if (pathData && pathRef.current) {
    const length = pathRef.current.getTotalLength();
    setPathLength(length);
  }
}, [pathData]);

  // ★ points が更新されたときにアニメーションをリセットするためのキー ★
  // pathData が変わるたびに SVG 要素全体を再マウントさせる
  const animationKey = pathData;

  if (points && points.length > 0 && pathData) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        {/* ★ key を追加して points 変更時に SVG を再生成 ★ */}
        <svg
          key={animationKey}
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="mb-4"
        >
          <path
            id={pathId}
            ref={pathRef}
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth * 100 / size} // strokeWidth を viewBox サイズ基準に調整
            strokeLinecap="round"
            strokeLinejoin="round"
            // ★ strokeDasharray と strokeDashoffset の初期値を設定 ★
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength}
            // ★ strokeOpacity は 1 で固定（アニメーション削除） ★
            strokeOpacity="1"
          >
            {/* stroke-dashoffsetアニメーション (線を描く) */}
            <animate
              attributeName="stroke-dashoffset"
              // ★ pauseDuration 中も 0 のままにする ★
              values={`${pathLength}; 0; 0`}
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              dur={`${totalDuration}s`}
              calcMode="linear"
              repeatCount="indefinite"
            />

            <animate
              attributeName="stroke-opacity"
              values="1; 1; 0" // <- これを削除
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              dur={`${totalDuration}s`}
              calcMode="linear"
              repeatCount="indefinite"
            />
          </path>

          <circle fill={dotColor} r={dotSize * 100 / size} visibility="hidden"> {/* ★ dotSize も viewBox 基準に調整 */}
            {/* パス移動アニメーション */}
            <animateMotion
              keyPoints="0; 1; 1"
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              calcMode="linear"
              dur={`${totalDuration}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>

            {/* 表示/非表示アニメーション */}
            <animate
              attributeName="visibility"
              // ★★★ アニメーション期間中だけ表示されるように修正 ★★★
              // 開始直後に visible、activeEndKeyTime で hidden、終了時に hidden
              values="hidden; visible; hidden; hidden"
              keyTimes={`0; 0.001; ${activeEndKeyTime}; 1`} // activeEndKeyTime で非表示に
              dur={`${totalDuration}s`}
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <h1 className="text-xl font-bold tracking-tight text-center">{loadingText}</h1>
      </div>
    );
  } else {
    // points がない場合のフォールバック (変更なし)
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-center">{loadingText}</h1>
      </div>
    );
  }
};