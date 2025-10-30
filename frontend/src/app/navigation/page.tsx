"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

const NavigationMap = dynamic(() => import('@/components/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center">
        <div className="w-8 h-8 bg-white rounded-full animate-pulse mb-4 mx-auto"></div>
        <p>マップを読み込んでいます...</p>
      </div>
    </div>
  ),
});

type RouteData = {
  id: string;
  total_distance_km: number;
  route_points: Array<{ lat: number; lng: number }>;
  start_distance: number;
  created_at: string;
  isFavorite: boolean;
};

function NavigationContent() {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // SessionStorageからナビゲーションデータを取得
    const storedData = sessionStorage.getItem('navigationData');

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRouteData(parsedData);
      } catch (error) {
        console.error('ナビゲーションデータの解析に失敗しました:', error);
        // エラーの場合はホームページにリダイレクト
        window.location.href = '/home';
      }
    } else {
      // データがない場合はホームページにリダイレクト
      console.warn('ナビゲーションデータが見つかりません');
      window.location.href = '/home';
    }

    setIsLoading(false);
  }, []);

  if (isLoading || !routeData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 bg-white rounded-full animate-pulse mb-4 mx-auto"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationMap
      routeData={routeData}
    />
  );
}

export default function NavigationPage() {
  return <NavigationContent />;
}
