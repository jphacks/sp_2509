// frontend/src/components/Slider.tsx
import React from "react";

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  disabled = false,
}: SliderProps) {
  // max と min が等しい場合の例外処理
  const safeMax = Math.max(max, min + 1);

  // 現在値の割合を計算
  const percentage = ((value - min) / (safeMax - min)) * 100;

  return (
    <div className={`w-full ${disabled ? "opacity-50" : ""}`}>
      {label ? (
        <label className="block text-sm text-gray-600 mb-2">{label}</label>
      ) : null}

      {/* 現在値（上に表示） */}
      <div className="mb-2">
        <span className="text-2xl font-semibold">{value}</span>
        {unit ? <span className="ml-1 text-gray-600">{unit}</span> : null}
      </div>

      {/* スライダー（下に配置） */}
      <div className="relative">
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
          className={`w-full h-4 rounded-lg appearance-none cursor-pointer ${
            disabled ? "cursor-not-allowed" : ""
          } absolute z-10 opacity-0`}
        />
        <div className="w-full h-4 bg-gray-200 rounded-lg absolute top-0">
          <div
            className="h-4 bg-black rounded-lg"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
