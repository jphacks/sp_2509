import React from 'react';

type TextProps = {
  text: string;
  color?: string;
  font?: string;
};

export default function Text({ text, color = 'text-gray-500', font = 'font-bold', }: TextProps) {
  // 固定のクラスとpropsで受け取ったcolorクラスを組み合わせる
  const combinedClassName = `text-sm ${font} ${color}`;

  return (<p className={combinedClassName}>{ text }</p>);
};