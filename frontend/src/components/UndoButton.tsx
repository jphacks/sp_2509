// frontend/src/components/UndoButton.tsx
"use client";

import React from "react";
import { FaUndo } from "react-icons/fa";

type UndoButtonProps = {
    onClick: () => void;
    disabled?: boolean;
};

export default function UndoButton({ onClick, disabled = false }: UndoButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex items-center justify-center gap-2
        w-full px-4 py-2 text-sm font-semibold
        rounded-lg shadow-sm
        transition-all duration-150 ease-out
        select-none
        ${disabled
                    ? 'bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-[0.98]'
                }
      `}
        >
            <FaUndo />
            <span>元に戻す</span>
        </button>
    );
}