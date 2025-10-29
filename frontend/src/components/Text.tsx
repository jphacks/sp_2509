import React from 'react';

type TextProps = {
  text: string;
  className?: string;
};

export default function Text({ text, className = 'text-gray-500 font-bold' }: TextProps) {
  // 固定のクラスとpropsで受け取ったcolorクラスを組み合わせる
  const combinedClassName = `text-sm ${className}`;

  return (<p className={combinedClassName}>{ text }</p>);
};