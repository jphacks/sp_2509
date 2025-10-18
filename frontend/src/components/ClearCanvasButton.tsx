// frontend/src/components/ClearCanvasButton.tsx
'use client';
import React from 'react';
import { FaTrashAlt } from 'react-icons/fa'; // 例としてゴミ箱アイコンを使用

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
        px-4 py-2 rounded text-sm shadow
        transition-colors duration-150 ease-in-out
        ${disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-black hover:bg-gray-700 text-white'     
        }
      `}
    >
      <FaTrashAlt /> {/* アイコン */}
      <span>{buttonText}</span>
    </button>
  );
};

export default ClearCanvasButton;