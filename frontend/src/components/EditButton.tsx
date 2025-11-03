"use client";
import React from "react";
import { IconType } from "react-icons";

type EditButtonProps = {
    buttonText: string;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
};

export default function EditButton({
    buttonText,
    icon: Icon,
    onClick,
    disabled = false,
}: EditButtonProps) {
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
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-white text-black hover:bg-gray-200 active:scale-[0.97]",
            ].join(" ")}
        >
            {Icon && <Icon size={22} />}
            <span>{buttonText}</span>
        </button>
    );
}
