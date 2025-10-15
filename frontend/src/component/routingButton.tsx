"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons";

type RoutingButtonProps = {
  buttonText: string;
  to: string;
  icon?: IconType;
};

export default function RoutingButton({ buttonText, to, icon: Icon }: RoutingButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(20);
    }

    // 一瞬灰色にしてから遷移
    setIsActive(true);
    setTimeout(() => {
      setIsActive(false);
      router.push(to);
    }, 250); // ← 灰色で表示する時間（ms）
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center gap-2
        w-[320px] md:w-[420px] lg:w-[480px]
        px-8 py-4 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md hover:shadow-lg
        transition-all duration-200 ease-out
        select-none font-sans
        ${
          isActive
            ? "bg-gray-500 text-black scale-[0.97]" // ← 灰色（やや押し込み）
            : "bg-black text-white hover:brightness-105"
        }
      `}
    >
      {Icon && <Icon size={22} />}
      <span>{buttonText}</span>
    </button>
  );
}
