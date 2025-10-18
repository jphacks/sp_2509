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
        px-4 py-2 rounded text-sm
        transition-colors duration-150 ease-in-out
        ${disabled
          ? 'bg-white text-gray-300 cursor-not-allowed border border-gray-300' 
          : 'bg-black hover:bg-gray-700 text-white'     
        }
      `}
    >
      <FaArrowRotateLeft /> {/* アイコン */}
      <span>{buttonText}</span>
    </button>
  );
};

export default ClearCanvasButton;