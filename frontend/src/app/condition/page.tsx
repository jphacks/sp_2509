'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DrawnShapeImage from '@/components/DrawnShapeImage';

const CenterPinMap = dynamic(() => import('@/components/CenterPinMap'), { ssr: false });

type Point = { x: number; y: number };
const heartPoints: Point[] = [
  { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
  { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
  { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 },
].map(p => ({ x: (p.x * 350) / 300, y: (p.y * 350) / 300 }));

export default function Condition() {
  const router = useRouter();

  // ★ 赤ピン（地図中心）を保持
  const [center, setCenter] = useState<[number, number] | null>(null);

  // ★ ボタン押下でクエリに載せて遷移
  const goNext = () => {
    if (!center) return; // まだ未取得なら何もしない
    const [lat, lng] = center;
    router.push(`/route?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">条件設定</h1>
        <p className="text-gray-500 text-sm">&lt;描き直す</p>

        <div className="space-y-1">
          <p className="font-semibold">あなたの描いた絵</p>
          <DrawnShapeImage
            points={heartPoints}
            size={160}
            strokeColor="#ef4444"
            strokeWidth={3}
            padding={8}
            className="bg-gray-100 border border-gray-300"
          />
        </div>

        <div className="space-y-1">
          <p className="font-semibold">スタート地点を選択</p>
          <p className="text-gray-500 text-sm">どこから走り始めますか？</p>

          {/* ★ CenterPinMap から赤ピン座標を常時受け取って保持 */}
          <CenterPinMap
            height={220}
            onCenterChange={(c) => setCenter(c)}
          />

          {/* デバッグ表示（不要なら削除OK） */}
          <p className="text-xs text-gray-500">
            選択中の中心：{center ? `${center[0].toFixed(6)}, ${center[1].toFixed(6)}` : '—'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold">おおよその走行距離</p>
          <p className="text-gray-800">10km</p>
          <div className="w-full h-2 bg-gray-200 rounded-full" />
        </div>

        {/* ★ ボタンで送信して遷移 */}
        <button
          onClick={goNext}
          disabled={!center}
          className="w-full mt-4 bg-black text-white py-3 rounded-lg shadow-md enabled:hover:bg-gray-800 disabled:opacity-50"
        >
          この内容でルートを作成
        </button>
      </div>
    </main>
  );
}
