// jphacks/sp_2509/sp_2509-a378f8e8d74c8510cd17bbdfc0eecd7d10652dd6/frontend/src/app/condition/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DrawnShapeImage from '../../components/DrawnShapeImage';
import Slider from '../../components/Slider';
import Loading from '../../components/Loading'; // ★ 追加
import type { Point } from '../../types/types';

const CenterPinMap = dynamic(() => import('../../components/CenterPinMap'), { ssr: false });

const API_URL = "/api";


// ★ レスポンスデータの型を定義 (必要に応じて src/types/types.ts に移動)
type LatLng = { lat: number; lng: number };
type RouteCalculateResponse = {
  total_distance_km: number;
  route_points: LatLng[];
  drawing_points: LatLng[]; // API は描画点の地理座標も返す
};


export default function Condition() {
  const router = useRouter();

  // localStorage から読み込む描画点
  const [loadedDrawingPoints, setLoadedDrawingPoints] = useState<Point[]>([]);
  // 地図中心（スタート地点）
  const [center, setCenter] = useState<[number, number] | null>(null);
  // おおよその走行距離（km）
  const [distanceKm, setDistanceKm] = useState<number>(10);
  // 送信中制御
  const [submitting, setSubmitting] = useState(false);

  // 初回マウント時に描画データを読み込み
  useEffect(() => {
    try {
      const saved =
        typeof window !== 'undefined' ? localStorage.getItem('drawingPointsData') : null;
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

  const canSubmit = useMemo(
    () => !!center && loadedDrawingPoints.length > 0 && !submitting,
    [center, loadedDrawingPoints.length, submitting]
  );

  // 次のページへ：バックエンドに POST。失敗時は localStorage + クエリでフォールバック。
  const goNext = async () => {
    if (!center) {
      alert('スタート地点を地図で選択してください。');
      return;
    }
    if (submitting) return; // 二重送信防止

    const [lat, lng] = center;

    // 送信用ペイロード
    const payload = {
      drawing_display_points: loadedDrawingPoints,            // 点群データ（描いたコース）
      start_location: { lat, lng },                   // 赤ピン座標
      target_distance_km: distanceKm,                             // スライダー値
    } as const;

    console.log("送信します");
    setSubmitting(true); // ★ 押した瞬間にローディングへ切替
    try {
      const res = await fetch(`${API_URL}/routes/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // サーバーが routeId を返す想定
        console.log("返ってきた");
        const data: RouteCalculateResponse = await res.json();
        localStorage.setItem('responsePointsData', JSON.stringify(data));

        // /route へ遷移（IDがあるならそれを使う）
        router.push(`/route`);
      }
    } catch (e) {
      console.error('Failed to parse drawing points from localStorage:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // ★ 送信中はフルスクリーンのローディング画面を表示（完了したら goNext 内の router.push で遷移）
  if (submitting) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Loading
          loadingText="ルートを計算中…"
          points={loadedDrawingPoints}
          size={120}
          strokeColor="#ef4444"
          strokeWidth={2.5}
          dotColor="#111"
          dotSize={4}
          animationDuration={2.2}
          pauseDuration={0.8}
        />
      </main>
    );
  }

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
          <p className="text-gray-500 text-sm">
            どこから走り始めますか？地図を動かして中央のピン位置を決めてください。
          </p>
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
          {submitting ? '送信中…' : 'この内容でルートを作成'}
        </button>
      </div>
    </main>
  );
}
