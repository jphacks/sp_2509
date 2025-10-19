// frontend/src/components/SelectedShapePlaceholder.tsx
"use client";

import React from "react";
import { IoIosCloseCircle } from "react-icons/io";

type Props = {
    /** 親からレイアウト制御したい場合に渡す（例: w-full h-full） */
    className?: string;
    /** 表示メッセージ（既定: おすすめを選択中） */
    message?: string;
};

export default function SelectedShapePlaceholder({
    className = "w-full h-full",
    message = "おすすめを選択中",
}: Props) {
    return (
        <div className={`relative ${className}`}>
            <div
                className="
          absolute inset-0
          bg-white rounded-lg shadow-md
          flex flex-col items-center justify-center
          select-none
        "
            >
                <IoIosCloseCircle className="text-6xl text-gray-400 mb-3" aria-hidden />
                <span className="text-gray-600 text-base">{message}</span>
            </div>
        </div>
    );
}
