"use client";
import React from "react";
import { IconType } from "react-icons";

type CancelButtonProps = {
    buttonText: string;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
};

export default function CancelButton({
    buttonText,
    icon: Icon,
    onClick,
    disabled = false,
}: CancelButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "flex items-center justify-center gap-2 w-full py-3 text-lg font-semibold tracking-wide",
                "rounded-2xl shadow-md transition-all duration-200 ease-out select-none font-sans",
                disabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600 active:scale-[0.97]",
            ].join(" ")}
        >
            {Icon && <Icon size={22} />}
            <span>{buttonText}</span>
        </button>
    );
}
