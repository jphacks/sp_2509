"use client";

import React from "react";
import { FaTimes } from "react-icons/fa";

type CancelEditButtonProps = {
    onClick: () => void;
    disabled?: boolean;
};

export default function CancelEditButton({ onClick, disabled = false }: CancelEditButtonProps) {
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
                    : 'bg-red-500 text-white border border-red-500 hover:bg-red-600 active:scale-[0.98]'
                }
      `}
        >
            <FaTimes />
            <span>編集を破棄</span>
        </button>
    );
}