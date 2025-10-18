// jphacks/sp_2509/sp_2509-a378f8e8d74c8510cd17bbdfc0eecd7d10652dd6/frontend/src/app/condition/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DrawnShapeImage from '../../components/DrawnShapeImage';
import Slider from '../../components/Slider';
import type { Point } from '../../types/types';

// 地図はクライアント専用
const CenterPinMap = dynamic(() => import('../../components/CenterPinMap'), { ssr: false });

export default function Condition() {
  const router = useRouter();

  // localStorage から読み込む描画点
  const [loadedDrawingPoints, setLoadedDrawingPoints] = useState<Point[]>([]);
  // 地図中心（スタート地点）
  const [center, setCenter] = useState<[number, number] | null>(null);
  // おおよその走行距離（km）
  const [distanceKm, setDistanceKm] = useState<number>(10);

  // 初回マウント時に描画データを読み込み
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('drawingPointsData') : null;
      if (!saved) {
        alert('描画データが見つかりません。前のページでコースを描いてください。');
        router.back();
        return;
      }
      const points = JSON.parse(saved) as Point[];
      if (!Array.isArray(points) || points.length === 0) {
        alert('コース形状の読み込みに失敗しました。');
        router.back();
        return;
      }
      setLoadedDrawingPoints(points);
    } catch (e) {
      console.error('Failed to parse drawing points from localStorage:', e);
      alert('コース形状の読み込みに失敗しました。');
      router.back();
    }
  }, [router]);

  // 次のページへ：描画点は localStorage に保存して、中心と距離はクエリで渡す
  const goNext = () => {
    if (!center) {
      alert('スタート地点を地図で選択してください。');
      return;
    }
    try {
      // /route 側で読むために最終データとして保存
      localStorage.setItem('finalDrawingPoints', JSON.stringify(loadedDrawingPoints));
    } catch (_) {
      // 保存に失敗してもクエリで進めるので致命ではない
    }
    const [lat, lng] = center;
    const url = `/route?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&dist=${distanceKm}`;
    router.push(url);
  };

  const canSubmit = center !== null && loadedDrawingPoints.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">条件設定</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-500 text-sm hover:underline text-left"
        >
          &lt; 描き直す
        </button>

        {/* プレビュー：あなたの描いた絵 */}
        <section className="space-y-1">
          <p className="font-semibold">あなたの描いた絵</p>
          <DrawnShapeImage
            points={loadedDrawingPoints}
            size={160}
            strokeColor="#ef4444"
            strokeWidth={3}
            padding={8}
            className="bg-gray-100 border border-gray-300"
          />
        </section>

        {/* スタート地点を選択 */}
        <section className="space-y-1">
          <p className="font-semibold">スタート地点を選択</p>
          <p className="text-gray-500 text-sm">どこから走り始めますか？地図を動かして中央のピン位置を決めてください。</p>
          <CenterPinMap height={220} onCenterChange={(c) => setCenter(c)} />
          <p className="text-xs text-gray-500">
            選択中の中心：{center ? `${center[0].toFixed(6)}, ${center[1].toFixed(6)}` : '—'}
          </p>
        </section>

        {/* 距離スライダー */}
        <section className="space-y-1">
          <Slider
            label="おおよその走行距離"
            value={distanceKm}
            onChange={setDistanceKm}
            min={1}
            max={50}
            step={0.5}
            unit="km"
          />
        </section>

        {/* 送信ボタン */}
        <button
          onClick={goNext}
          disabled={!canSubmit}
          className="w-full mt-2 bg-black text-white py-3 rounded-lg shadow-md enabled:hover:bg-gray-800 disabled:opacity-50"
        >
          この内容でルートを作成
        </button>
      </div>
    </main>
  );
}
