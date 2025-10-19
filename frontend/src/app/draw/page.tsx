// frontend/src/app/draw/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import DrawingCanvas from '../../components/DrawingCanvas';
import Title from '../../components/Title';
import Header from '../../components/Header';
import CarouselWithClick, { CarouselClickItem } from '../../components/CarouselWithClick'; // CarouselClickItem をインポート
import BackButton from '../../components/BackButton';
import RoutingButton from '../../components/RoutingButton';
import ClearCanvasButton from '../../components/ClearCanvasButton';
// RecommendedShape は不要
import type { Point } from '../../types/types';


// --- 図形データ定義 ---
// ハート型
const heartShape: Point[] = [
    { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
    { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
    { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 }
];

// 星型 (例として追加)
const starShape: Point[] = [
    { x: 175, y: 50 }, { x: 209, y: 150 }, { x: 300, y: 150 }, { x: 227, y: 209 },
    { x: 259, y: 300 }, { x: 175, y: 250 }, { x: 91, y: 300 }, { x: 123, y: 209 },
    { x: 50, y: 150 }, { x: 141, y: 150 }, { x: 175, y: 50 }
];

// --- Draw コンポーネント本体 ---
export default function Draw() {
  // drawingPoints: localStorageに保存するデータ、および「次へ」ボタンの有効化判定に使う
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  // selectedShape はCanvas描画専用だったが、今回は使わない
  // const [selectedShape, setSelectedShape] = useState<Point[] | undefined>(undefined);

  // ★★★ 「書き直す」ボタンは drawingPoints にデータがあるかどうかだけで判定 ★★★
  const isClearButtonDisabled = drawingPoints.length === 0;

  const router = useRouter();

  // ★★★ handleDrawEnd: 手描きした場合の処理 ★★★
  const handleDrawEnd = useCallback((points: Point[]) => {
    // 手描きした場合は drawingPoints を更新
    setDrawingPoints(points);
    // 手描きがクリアされた場合も drawingPoints を更新
    if (points.length === 0) {
        setDrawingPoints([]);
    }
  }, []);

  // ★★★ handleClear: クリア処理 ★★★
  const handleClear = () => {
    setClearTrigger(prev => prev + 1); // Canvasクリアをトリガー
    setDrawingPoints([]); // 保持しているデータもクリア
    // localStorageからも削除 (オプション)
    try {
        localStorage.removeItem('drawingPointsData');
    } catch (error) {
        console.error("Failed to remove drawing points from localStorage:", error);
    }
  };

  // ★★★ handleSelectShape: カルーセルアイテムクリック時の処理 ★★★
  const handleSelectShape = (item: CarouselClickItem) => {
    // shapeData がなければ何もしない
    if (!item.shapeData) {
        console.warn("選択されたアイテムに shapeData がありません:", item.description);
        return;
    }

    const shapeData = item.shapeData;
    const shapeDescription = item.description;

    try {
      // 1. shapeData を localStorage に保存
      localStorage.setItem('drawingPointsData', JSON.stringify(shapeData));

      // 2. drawingPoints ステートを更新 (ボタン有効化のため)
      setDrawingPoints(shapeData);

      // 3. Canvas をクリア状態にする (見た目上は描画しない)
      //    DrawingCanvas は clearSignal の変更でクリアされるので、ここでトリガーを更新
      setClearTrigger(prev => prev + 1);

      // 4. ユーザーに通知
      alert(`${shapeDescription} を選択しました。`);

    } catch (error) {
      console.error("Failed to save drawing points to localStorage:", error);
      alert('形状データの保存に失敗しました。');
      // エラーが発生したらクリアしておく
      handleClear();
    }
  };


  // --- カルーセルアイテムの定義 ---
  const items: CarouselClickItem[] = [
    {
        src: '/images/testHeart.png', // 画像パスを確認してください
        alt: 'Heart Shape',
        description: 'ハート型',
        shapeData: heartShape,
        onClick: () => handleSelectShape({ // handleSelectShape を呼び出す
            src: '/images/testHeart.png',
            alt: 'Heart Shape',
            description: 'ハート型',
            shapeData: heartShape
        }),
    },
    {
        src: '/images/testImage.png', // 画像パス (仮)
        alt: 'Star Shape',
        description: '星型',
        shapeData: starShape,
        onClick: () => handleSelectShape({ // handleSelectShape を呼び出す
            src: '/images/testImage.png',
            alt: 'Star Shape',
            description: '星型',
            shapeData: starShape
        }),
    },
    // 他のおすすめ図形も同様に追加...
  ];


  // ★★★ navigateToCondition: localStorageのデータをチェックしてから遷移 ★★★
  const navigateToCondition = () => {
    // localStorageにデータがあるか、またはdrawingPointsステートにデータがあるか確認
    const pointsToUse = drawingPoints; // ステートを正とする
    if (pointsToUse.length < 2) {
        // localStorageを再確認 (直接遷移してきた場合など)
        try {
            const savedData = localStorage.getItem('drawingPointsData');
            if (savedData) {
                const parsedPoints = JSON.parse(savedData) as Point[];
                if (parsedPoints.length >= 2) {
                    setDrawingPoints(parsedPoints); // ステートにも反映
                    router.push('/condition');
                    return;
                }
            }
        } catch (error) {
             console.error("Failed to read/parse drawing points from localStorage:", error);
        }
        // それでもデータがなければエラー
        alert('コースの形を描くか、おすすめから選択してください。');
        return;
    }
    // drawingPoints ステートにデータがあれば、それが最新として遷移
    router.push('/condition');
  };


    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
            <div className="text-center px-4 mb-4">
                <Title title="コースの形を描く" />

                <div className="z-10 w-full self-start">
                    <BackButton text="ホームに戻る" to="/home" />
                </div>

                <div className="w-full aspect-[1] mt-4 flex justify-center">
                    <DrawingCanvas
                        strokeWidth={6}
                        strokeColor="#FF0000"
                        onDrawEnd={handleDrawEnd}
                        // initialPoints は常に undefined (カルーセル選択で描画しないため)
                        initialPoints={undefined}
                        clearSignal={clearTrigger}
                    />
                </div>

                <div className="flex justify-center space-x-4 mt-2">
                    <ClearCanvasButton
                        onClick={handleClear}
                        buttonText="書き直す"
                        disabled={isClearButtonDisabled} // 修正された判定を使用
                    />
                </div>

                <div className="mt-4 text-black">
                    <Header headerText="おすすめから選ぶ" />
                </div>

                {/* CarouselWithClick を使用 */}
                <div className="p-4">
                    <CarouselWithClick items={items}/>
                </div>

                <div className="mt-8 flex justify-center">
                    <RoutingButton
                        buttonText="条件設定へ進む"
                        onClick={navigateToCondition}
                        // ★★★ drawingPoints の長さで判定 ★★★
                        disabled={drawingPoints.length === 0}
                    />
                </div>

            </div>
        </div>
        </main>
    );
}