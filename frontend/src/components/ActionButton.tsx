// frontend/src/components/ActionButton.tsx
"use client";
import React from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";

interface ActionButtonProps {
  onClick: () => void; // 親から受け取るクリック時の処理
  disabled?: boolean; // ボタンを無効化するかどうか
  buttonText?: string; // ボタンのテキスト (オプション)
  buttonColor?: string; // ボタンの背景色 (オプション)
  textColor?: string; // ボタンの文字色 (オプション)
  icon?: React.ReactNode; // 任意でアイコンを差し替え可能
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  buttonText = "Action",
  buttonColor = "white",
  textColor = "black",
  icon = <FaArrowRotateLeft />,
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
        ${
          disabled
            ? "cursor-not-allowed text-gray-300 hover:bg-white"
            : "hover:brightness-90"
        }
      `}
      style={{
        backgroundColor: disabled ? "#f9f9f9" : buttonColor,
        color: disabled ? "#d1d1d1" : textColor,
      }}
    >
      {icon}
      <span>{buttonText}</span>
    </button>
  );
};

export default ActionButton;
