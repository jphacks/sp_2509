// frontend/src/components/ClearCanvasButton.tsx
'use client';
import React from 'react';
import { FaArrowRotateLeft } from "react-icons/fa6";

interface ClearCanvasButtonProps {
  onClick: () => void; // 親から受け取るクリック時の処理
  disabled?: boolean; // ボタンを無効化するかどうか
  buttonText?: string; // ボタンのテキスト (オプション)
}

const ClearCanvasButton: React.FC<ClearCanvasButtonProps> = ({
  onClick,
  disabled = false,
  buttonText = 'Clear',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2
        py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md w-1/2
        transition-all duration-200 ease-out
        select-none font-sans
        ${disabled
          ? 'bg-white text-gray-300 cursor-not-allowed border border-gray-300' 
          : 'bg-white hover:bg-gray-200 text-[#f4541f]'     
        }
      `}
    >
      <FaArrowRotateLeft /> {/* アイコン */}
      <span>{buttonText}</span>
    </button>
  );
};

export default ClearCanvasButton;