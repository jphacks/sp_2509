"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';
import  Header  from  "../component/Header";
import Title from '../component/title';
import RoutingButton from '../component/routingButton';
import { FaArrowRight, FaBeer } from "react-icons/fa";

// クライアントサイドでMapコンポーネントを読み込む
const RouteMap = dynamic(() => import('../components/RouteMap'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<LatLngExpression[]>([]);

  // --- テストデータ ---
  // 東京エリア
  const routePositionsTokyo: LatLngExpression[] = [
    [35.6895, 139.6917], // 新宿
    [35.6812, 139.7671], // 東京駅
    [35.6586, 139.7454], // 東京タワー
  ];

  // 大阪エリア（広域）
  const routePositionsOsaka: LatLngExpression[] = [
    [34.702485, 135.495951], // 大阪駅
    [34.6525, 135.5063],    // 通天閣
    [34.6937, 135.1955],     // 神戸
  ];

  // 北海道（さらに広域）
  const routePositionsHokkaido: LatLngExpression[] = [
    [43.0621, 141.3544], // 札幌
    [41.7687, 140.7288], // 函館
    [43.7707, 142.3650],  // 旭川
  ];

  // 指で書いた線のモック
  const drawnLinePositions: LatLngExpression[] = [
    [35.6985, 139.7017],
    [35.6995, 139.7117],
    [35.6905, 139.7217],
    [35.6885, 139.7317],
  ];

  const fetchMessage = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/message`);
      if (!res.ok) {
        throw new Error('Failed to fetch message');
      }
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Sample App</h1>

          <div className='my-8'>
            <RouteMap positions={activeRoute} drawnLine={drawnLinePositions} />
          </div>

          <div className="flex justify-center gap-4 my-4">
            <button onClick={() => setActiveRoute(routePositionsTokyo)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">東京</button>
            <button onClick={() => setActiveRoute(routePositionsOsaka)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">大阪</button>
            <button onClick={() => setActiveRoute(routePositionsHokkaido)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">北海道</button>
            <button onClick={() => setActiveRoute([])} className="px-4 py-2 bg-red-200 rounded hover:bg-red-300">クリア</button>
          </div>

          
        
          <Title title={'Title'}/>
          <Header headerText = {"This is a header."}/>
          <RoutingButton
            buttonText="press"
            to="/home"     // 遷移先ページ
            icon={FaArrowRight}  // ← アイコンを付けたい場合
          />
          
     
          <button
            onClick={fetchMessage}
            disabled={isLoading}
            className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 w-[250px]"
          >
            {isLoading ? 'Loading...' : 'Get Message from Backend'}
          </button>

          <div className="mt-6 min-h-[60px]">
            {error && <p className="mt-2 text-red-500">{error}</p>}
            {message && (
              <div>
                <p className="mt-4 text-lg">
                  Message from backend:
                </p>
                <p className="mt-2 text-2xl font-semibold text-green-500">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
