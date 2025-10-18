// frontend/src/components/RoutingButton.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons";

type RoutingButtonProps = {
  buttonText: string;
  to?: string;
  icon?: IconType;
  onClick?: () => void;
  disabled?: boolean;
};

export default function RoutingButton({
  buttonText,
  to,
  icon: Icon,
  onClick,
  disabled = false,
}: RoutingButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  const handlePress = () => {
    // ★★★ disabled なら何もしない ★★★
    if (disabled) return;
    setIsActive(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(20);
    }
  };

  const handleRelease = () => {
    if (disabled) return;
    setIsActive(false);
    setTimeout(() => {
      // ★★★ onClick があれば実行し、なければ to に遷移 ★★★
      if (onClick) {
        onClick();
      } else if (to) {
        router.push(to);
      }
    }, 100); // 少し遅延させてアニメーションを見せる
  };

  // ★★★ 離れたときも disabled なら何もしないように修正 ★★★
  const handleLeave = () => {
    if (disabled) return;
    setIsActive(false);
  };

  return (
    <button
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseLeave={handleLeave} // ★★★ handleLeave を使う ★★★
      disabled={disabled} // ★★★ disabled 属性を追加 ★★★
      className={`
        flex items-center justify-center gap-2
        w-full py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md
        transition-all duration-200 ease-out
        select-none font-sans
        ${disabled // ★★★ disabled のスタイルを追加 ★★★
          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
          : isActive
            ? 'bg-gray-500 text-black scale-[0.97]'
            : 'bg-black text-white hover:brightness-105 hover:shadow-lg active:scale-[0.97]'
        }
      `}
    >
      {Icon && <Icon size={22} />}
      <span>{buttonText}</span>
    </button>
  );
}