'use client';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false }); // 任意

export default function RoutePage() {
  const params = useSearchParams();
  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  const hasCenter = Number.isFinite(lat) && Number.isFinite(lng);

  const center: [number, number] | null = useMemo(
    () => (hasCenter ? [lat, lng] : null),
    [hasCenter, lat, lng]
  );

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">ルート作成</h1>
      <p className="text-sm text-gray-600">
        受け取った座標: {hasCenter ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '未指定'}
      </p>

      {/* 任意：受け取った座標で地図を表示 */}
      {center && (
        <RouteMap positions={[center]} height={260} />
      )}
    </main>
  );
}
