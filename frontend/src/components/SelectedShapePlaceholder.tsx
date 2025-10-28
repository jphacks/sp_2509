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
    onClick?: () => void; // ★: onClick プロパティを追加
};

export default function SelectedShapePlaceholder({
    className = "w-full h-full",
    message = "おすすめを選択中",
    onClick, // ★: onClick プロパティを受け取る
}: Props) {
    return (
        // ★: 外側の div に onClick を設定し、cursor-pointer を追加
        <div
            className={`${className} flex flex-col items-center cursor-pointer bg-transparent justify-center`}
            onClick={onClick}
            role="button" // ★: クリック可能であることを示す role 属性を追加
            tabIndex={0} // ★: キーボード操作可能にするために tabIndex を追加
            onKeyDown={(e) => { // ★: Enterキーでもクリックできるようにする
                if (e.key === 'Enter' && onClick) {
                    onClick();
                }
            }}
        >
            <div
                className="text-6xl
          flex flex-col items-center 
          select-none
        "
            >
                <IoIosCloseCircle className="text-6xl text-gray-400 mb-3" aria-hidden />
                {/* 既存のメッセージ */}
                <span className="text-gray-600 text-base">{message}</span>
                {/* 文字サイズを小さくする */}
                <span className="text-gray-600 text-xs mt-1">ここをタップして解除</span>
            </div>
        </div>
    );
}