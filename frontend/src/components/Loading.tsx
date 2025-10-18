import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

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
    const scale = Math.min(
        shapeWidth > 0 ? availableSize / shapeWidth : Infinity,
        shapeHeight > 0 ? availableSize / shapeHeight : Infinity
    );
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
  strokeColor = 'currentColor',
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
      requestAnimationFrame(() => {
        if (pathRef.current) {
          setPathLength(pathRef.current.getTotalLength());
        }
      });
    } else {
      setPathData('');
      setPathLength(0);
    }
  }, [points, size]);

  if (points && points.length > 0 && pathData) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <svg
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
            strokeWidth={strokeWidth * 100 / size}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength}
            strokeOpacity="1"
          >
            {/* stroke-dashoffsetアニメーション */}
            <animate
              attributeName="stroke-dashoffset"
              values={`${pathLength}; 0; 0`}
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              dur={`${totalDuration}s`}
              calcMode="linear" // ★★★ 追加: 線形補間を指定 ★★★
              repeatCount="indefinite"
            />
            {/* stroke-opacityアニメーション */}
            <animate
              attributeName="stroke-opacity"
              values="1; 1; 0"
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              dur={`${totalDuration}s`}
              calcMode="linear" // ★★★ 追加: 線形補間を指定 ★★★
              repeatCount="indefinite"
            />
          </path>

          <circle fill={dotColor} r={dotSize} visibility="hidden">
            {/* パス移動アニメーション */}
            <animateMotion
              keyPoints="0; 1; 1"
              keyTimes={`0; ${activeEndKeyTime}; 1`}
              calcMode="linear" // ★★★ 確認: デフォルトで線形だが明示 ★★★
              dur={`${totalDuration}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>

            {/* 表示/非表示アニメーション */}
            <animate
              attributeName="visibility"
              values="hidden; visible; hidden; hidden"
              keyTimes={`0; 0.001; ${activeEndKeyTime}; 1`}
              dur={`${totalDuration}s`}
              // visibilityは離散的なのでcalcModeは不要
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <h1 className="text-xl font-bold tracking-tight text-center">{loadingText}</h1>
      </div>
    );
  }
else{
  // pointsがない場合はスピナーアニメーション
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