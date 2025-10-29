// frontend/src/components/Slider.tsx
import React from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  disabled = false,
}: SliderProps) {
  const safeMax = Math.max(max, min + 1);
  const percentage = ((value - min) / (safeMax - min)) * 100;

  // ★ つまみのサイズ (Tailwindのクラス h-6 w-6 に対応)
  const thumbSize = 24; // px

  return (
    <div className={`w-full ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      {/* 現在値 */}
      <div className="mb-2">
        <span className="text-2xl font-semibold">{value}</span>
        {unit ? <span className="ml-1 text-gray-600">{unit}</span> : null}
      </div>

      {/* スライダー本体 (高さを少し確保) */}
      <div className="relative h-6"> {/* ★ 高さを h-4 から h-6 に変更 */}
        {/* 透明なinput要素 (変更なし) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(Number(e.target.value))
          }
          // ★ 高さを親要素に合わせる
          className={`w-full h-full rounded-lg appearance-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          } absolute z-10 opacity-0`}
        />
        {/* トラック背景 (中央に配置するため top を調整) */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 rounded-lg transform -translate-y-1/2"> {/* ★ h-4 -> h-2, top-1/2, -translate-y-1/2 */}
          {/* 進捗バー (中央に配置するため top を調整) */}
          <div
            className="absolute top-0 left-0 h-full bg-black rounded-lg" // ★ h-4 -> h-full
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* ★ 丸いつまみを追加 ★ */}
        <div
          className={`
            absolute top-1/2 transform -translate-y-1/2 // 上下中央揃え
            w-6 h-6 // サイズ指定 (thumbSizeに対応)
            bg-black // 色
            rounded-full // 円形にする
            shadow-md // 影
            pointer-events-none // input要素の操作を妨げないように
            transition-all duration-100 ease-out // (任意) アニメーション
          `}
          style={{
            // ★ 位置計算: 左端からの割合 - つまみの半径分左にずらす
            left: `calc(${percentage}% - ${thumbSize / 2}px)`,
          }}
        ></div>
      </div>
    </div>
  );
}