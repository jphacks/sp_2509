"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons"; // アイコン型をインポート

type RoutingButtonProps = {
  buttonText: string;
  to: string; // 遷移先パス
  icon?: IconType; // アイコンを受け取る（例：FaBeer）
};

export default function RoutingButton({ buttonText, to, icon: Icon }: RoutingButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(to);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      {/* アイコンが指定されていれば表示 */}
      {Icon && <Icon size={24} />}
      <span>{buttonText}</span>
    </button>
  );
}
