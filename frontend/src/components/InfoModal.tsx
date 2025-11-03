import React, { useState, useEffect } from "react";

type InfoModalProps = {
  show: boolean;
  title: string;
  buttonLabel: string;
  onConfirm: () => void;
  children: React.ReactNode;
};

const InfoModal: React.FC<InfoModalProps> = ({ show, title, buttonLabel, onConfirm, children }) => {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (show) {
      // アニメーションを開始するために、マウント直後に状態を更新
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleConfirm = () => {
    // 閉じるアニメーションを開始
    setIsAnimatingIn(false);
    // アニメーション後に親コンポーネントのコールバックを呼ぶ
    setTimeout(onConfirm, 300); // 300msはtransition-durationと合わせる
  };

  if (!show) {
    return null;
  }

  const backdropAnimation = isAnimatingIn ? "opacity-100" : "opacity-0";
  const modalAnimation = isAnimatingIn ? "translate-y-0" : "translate-y-full";

  return (
    <div
      className={`fixed inset-0 z-[2000] flex justify-center items-end p-4 transition-opacity duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${backdropAnimation}`}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleConfirm} />
      <div
        className={`bg-white rounded-3xl shadow-xl w-full max-w-md transform transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${modalAnimation}`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
          <div className="text-gray-600 space-y-4">
            {children}
          </div>
        </div>
        <div className="p-4 pt-0">
          <button
            onClick={handleConfirm}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-2xl transition-colors duration-200"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
