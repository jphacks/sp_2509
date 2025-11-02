'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Title from '@/components/Title';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import RoutingButton from '@/components/RoutingButton';
import Text from '@/components/Text';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FaPencilAlt } from "react-icons/fa";

// CenterPinMapを動的にインポート
const CenterPinMap = dynamic(() => import('../../components/CenterPinMap'), {
  ssr: false,
});

export default function StartPage() {
  const router = useRouter();
  const [center, setCenter] = useState<[number, number] | null>(null);

  // ページ読み込み時にlocalStorageから既存のスタート位置を読み込む
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('startLocation');
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        setCenter(parsedLocation);
      }
    } catch (error) {
      console.error("Failed to load start location from localStorage:", error);
    }
  }, []);


  const canProceed = useMemo(() => center !== null, [center]);

  const goToDrawPage = async () => {
    if (center) {
      try {
        // スタート地点をlocalStorageに保存
        localStorage.setItem('startLocation', JSON.stringify(center));
        console.log('スタート地点を保存しました:', center);

        // バックエンドに事前通知
        const payload = {
          start_location: { lat: center[0], lng: center[1] },
          target_distance_km: 10, // 仮の値。この時点では正確な距離は不要
        };

        await fetch('/api/routes/calculate-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log('事前通知APIを呼び出しました。');

        // 描画ページへ遷移
        router.push('/draw');
      } catch (error) {
        console.error("Failed to process start location:", error);
        alert('処理中にエラーが発生しました。');
      }
    } else {
      alert('地図を動かしてスタート地点を決めてください。');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Title title="スタート地点の設定" />
          <div className="w-full self-start mt-2">
            <BackButton text="ホームに戻る" to="/home" />
          </div>
        </div>

        <section className="space-y-1">
          <Header headerText="スタート地点を選択" />
          <Text text="どこから走り始めますか？地図を動かして赤いピンの場所をスタート地点に設定してください。" />
          <CenterPinMap height={400} onCenterChange={setCenter} />
        </section>

        <div className="flex items-center space-x-4 text-xs text-gray-500 pt-1">
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md"></div>
            <Text
              text="現在位置"
              className="text-gray-500"
            />
          </div>
          <div className="flex items-center space-x-1">
            <FaMapMarkerAlt className="text-red-500" />
            <Text
              text="スタート地点"
              className="text-gray-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <RoutingButton
            buttonText="コースを描く"
            onClick={goToDrawPage}
            disabled={!canProceed}
            icon={FaPencilAlt}
          />
        </div>
      </div>
    </main>
  );
}
