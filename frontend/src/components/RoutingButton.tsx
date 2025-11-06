// frontend/src/components/RoutingButton.tsx
"use client";
import React, { useState, useRef } from "react";
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
  const ignoreMouseEvents = useRef(false);

  const handlePress = () => {
    if (disabled) return;
    setIsActive(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(20);
    }
  };

  const handleRelease = () => {
    if (disabled || !isActive) return; // 離すときにアクティブでなければ何もしない
    setIsActive(false);
    setTimeout(() => {
      if (onClick) {
        onClick();
      } else if (to) {
        router.push(to);
      }
    }, 100);
  };

  const handleLeave = () => {
    if (disabled) return;
    setIsActive(false);
  };

  // --- イベントハンドラをタッチとマウスで分離 ---

  const onTouchStart = () => {
    ignoreMouseEvents.current = true;
    handlePress();
  };

  const onMouseDown = () => {
    if (ignoreMouseEvents.current) return;
    handlePress();
  };

  const onTouchEnd = () => {
    handleRelease();
    // マウスイベントのエミュレーションが終わるまでフラグを維持
    setTimeout(() => {
      ignoreMouseEvents.current = false;
    }, 500);
  };

  const onMouseUp = () => {
    if (ignoreMouseEvents.current) return;
    handleRelease();
  };

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseLeave={handleLeave}
      onTouchCancel={handleLeave}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2
        w-full py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md
        transition-all duration-200 ease-out
        select-none font-sans
        ${disabled
          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
          : isActive
          ? 'bg-gray-500 text-white scale-[0.97]'
            : 'bg-black text-white hover:brightness-105 hover:shadow-lg active:scale-[0.97]'
        }
      `}
    >
      {Icon && <Icon size={22} />}
      <span>{buttonText}</span>
    </button>
  );
}
