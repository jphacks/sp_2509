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

  const handlePress = () => {
    setIsActive(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(20);
    }
  };

  const handleRelease = () => {
    setIsActive(false);
    setTimeout(() => {
      router.push(to);
    }, 100);
  };

  return (
    <button
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseLeave={() => setIsActive(false)}
      className={`
        flex items-center justify-center gap-2
        w-full py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md hover:shadow-lg
        transition-all duration-200 ease-out
        select-none font-sans
        ${isActive
          ? "bg-gray-500 text-black scale-[0.97]"
          : "bg-black text-white hover:brightness-105"
        }
      `}
    >
      {Icon && <Icon size={22} />}
      <span>{buttonText}</span>
    </button>
  );
}
