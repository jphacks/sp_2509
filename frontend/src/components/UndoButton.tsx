"use client";
import React from "react";
import { IconType } from "react-icons";

type UndoButtonProps = {
    buttonText: string;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
};

export default function UndoButton({
    buttonText,
    icon: Icon,
    onClick,
    disabled = false,
}: UndoButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "flex items-center justify-center gap-2",
                "w-full py-3 text-lg font-semibold tracking-wide",
                "rounded-2xl shadow-md transition-all duration-200 ease-out",
                "select-none font-sans",
                disabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 text-white hover:bg-yellow-600 active:scale-[0.97]",
            ].join(" ")}
        >
            {Icon && <Icon size={22} />}
            <span>{buttonText}</span>
        </button>
    );
}
