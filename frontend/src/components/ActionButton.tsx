// frontend/src/components/ActionButton.tsx
"use client";
import React from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  buttonText?: string;
  buttonColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  isfull?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  buttonText = "Action",
  buttonColor = "white",
  textColor = "black",
  icon = <FaArrowRotateLeft />,
  isfull = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2
        py-3 text-lg font-semibold tracking-wide
        rounded-2xl shadow-md
        ${isfull ? "w-full" : "w-auto px-6"}
        transition-all duration-200 ease-out
        select-none font-sans
        ${disabled
          ? "cursor-not-allowed text-gray-300 hover:bg-white"
          : "hover:brightness-90"}
      `}
      style={{
        backgroundColor: disabled ? "#f9f9f9" : buttonColor,
        color: disabled ? "#d1d1d1" : textColor,
      }}
    >
      {icon}
      <span>{buttonText}</span>
    </button>
  );
};

export default ActionButton;
