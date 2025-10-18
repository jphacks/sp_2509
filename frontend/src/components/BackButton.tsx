// frontend/src/components/BackButton.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronLeft } from 'react-icons/fa'; // 左向きのシェブロンアイコン

// --- コンポーネントのプロパティ定義 ---
interface BackButtonProps {
  text: string; // 表示するテキスト (例: "ホームに戻る")
  to?: string; // 遷移先のパス (指定しない場合はブラウザの戻る機能を使用)
}

// --- BackButton コンポーネント本体 ---
const BackButton: React.FC<BackButtonProps> = ({
  text,
  to,
}) => {
  const router = useRouter();

  // --- クリック時の処理 ---
  const handleClick = () => {
    if (to) {
      // to プロパティが指定されていれば、指定されたパスに遷移
      router.push(to);
    } else {
      // to プロパティがなければ、ブラウザの「戻る」機能を使う
      router.back();
    }
  };

  // --- レンダリング ---
  return (
    <button
      onClick={handleClick}
      // --- スタイル設定 (Tailwind CSS) ---
      className={`
        flex items-center group
        text-sm text-gray-600 hover:text-black
        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded
        transition-colors duration-150 ease-in-out
      `}
    >
      {/* 左向きアイコン */}
      <FaChevronLeft className="mr-1 h-3 w-3 transition-transform duration-150 ease-in-out group-hover:-translate-x-0.5" />
      {/* テキスト */}
      <span>{text}</span>
    </button>
  );
};

export default BackButton;