// frontend/src/components/DrawButton.tsx
"use client";
import React from "react";
import { FaPaintBrush } from "react-icons/fa";
import { IconType } from "react-icons";

type DrawButtonProps = {
    buttonText: string;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
    isActive?: boolean; // To show different style when drawing
};

export default function DrawButton({
    buttonText,
    icon: Icon = FaPaintBrush,
    onClick,
    disabled = false,
    isActive = false,
}: DrawButtonProps) {
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
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : isActive
                        ? "bg-green-600 text-white" // Active drawing style
                        : "bg-green-500 text-white hover:bg-green-600 active:scale-[0.97]"
                }
      `}
        >
            {Icon && <Icon size={22} />}
            <span>{buttonText}</span>
        </button>
    );
}