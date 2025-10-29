// frontend/src/components/SelectedShapePlaceholder.tsx
"use client";

import React from "react";
import { IoIosCloseCircle } from "react-icons/io";

type Props = {
    /** 親からレイアウト制御したい場合に渡す（例: w-full h-full） */
    className?: string;
    /** 表示メッセージ（既定: おすすめを選択中） */
    message?: string;
    /** タップ時に実行される関数 */
    onClick?: () => void;
};

export default function SelectedShapePlaceholder({
    className = "w-full h-full",
    message = "おすすめを選択中",
    onClick,
}: Props) {
    return (
        // ★ 親Div: 背景を透明にし、クリックイベントを設定
        <div
            className={`${className} flex flex-col items-center justify-center cursor-pointer bg-transparent z-20`} // z-20 を維持
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && onClick) {
                    onClick();
                }
            }}
        >
            {/* ★ 新しいDiv: テキストとアイコンを囲み、背景とスタイルを設定 */}
            <div className="bg-white text-gray-800 p-6 rounded-lg shadow-md inline-block max-w-[80%] text-center">
                {/* アイコンを背景Divの中に移動 */}
                <IoIosCloseCircle className="text-4xl text-gray-400 mb-2 mx-auto" aria-hidden />

                {/* メインメッセージ */}
                <span className="block text-lg font-bold">
                    {message}
                </span>

                {/* サブテキスト */}
                <span className="block text-xs text-gray-500 mt-1">
                    （タップして手描きモードに戻る）
                </span>
            </div>
        </div>
    );
}