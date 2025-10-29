// frontend/src/components/RecalculationButton.tsx
"use client";
import React from "react";
import { FaSyncAlt } from "react-icons/fa"; // 再計算に適した更新アイコン

type RecalculationButtonProps = {
    onClick?: () => void;
    disabled?: boolean;
};

export default function RecalculationButton({
    onClick,
    disabled = false,
}: RecalculationButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex items-center justify-center gap-2
        w-full py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md
        transition-all duration-200 ease-out
        select-none font-sans
        ${disabled
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.97]'
                }
      `}
        >
            <FaSyncAlt size={20} />
            <span>再計算</span>
        </button>
    );
}