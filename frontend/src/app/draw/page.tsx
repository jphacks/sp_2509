// frontend/src/app/draw/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';
import DrawingCanvas from '../../components/DrawingCanvas';
import Title from '../../components/Title';
import Header from '../../components/Header';
import CarouselWithClick, { CarouselClickItem } from '../../components/CarouselWithClick';
import BackButton from '../../components/BackButton';
import RoutingButton from '../../components/RoutingButton';
import ClearCanvasButton from '../../components/ClearCanvasButton';
import type { Point } from '../../types/types';

// --- 図形データ定義 ---
const heartShape: Point[] = [
    { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
    { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
    { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 }
];
const starShape: Point[] = [
    { x: 175, y: 50 }, { x: 209, y: 150 }, { x: 300, y: 150 }, { x: 227, y: 209 },
    { x: 259, y: 300 }, { x: 175, y: 250 }, { x: 91, y: 300 }, { x: 123, y: 209 },
    { x: 50, y: 150 }, { x: 141, y: 150 }, { x: 175, y: 50 }
];
const circleShape: Point[] = Array.from({ length: 105 }, (_, i) => {
    const angle = (i / 100) * 2 * Math.PI;
    return {
        x: 175 + 100 * Math.cos(angle),
        y: 175 + 100 * Math.sin(angle)
    };
});

// --- Draw コンポーネント本体 ---
export default function Draw() {
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [selectedItemDescription, setSelectedItemDescription] = useState<string | null>(null);

  const isClearButtonDisabled = drawingPoints.length === 0;
  const router = useRouter();

  // --- カルーセルアイテムクリック時の処理 ---
  const handleSelectShape = useCallback((item: CarouselClickItem) => {
    // ... (変更なし) ...
     if (!item.shapeData) {
        console.warn("選択されたアイテムに shapeData がありません:", item.description);
        return;
    }
    if (drawingPoints.length > 0 && selectedItemDescription === null) {
         if (!window.confirm("現在の描画内容はクリアされます。よろしいですか？")) {
            return;
        }
    }
    const shapeData = item.shapeData;
    const shapeDescription = item.description;
    try {
      console.log(`選択: ${shapeDescription}. localStorage に保存します。`);
      localStorage.setItem('drawingPointsData', JSON.stringify(shapeData));
      setDrawingPoints(shapeData);
      setSelectedItemDescription(shapeDescription);
      console.log('localStorage 保存完了、State 更新完了');
    } catch (error) {
      console.error("Failed to save drawing points to localStorage:", error);
      alert('形状データの保存に失敗しました。');
      localStorage.removeItem('drawingPointsData');
      setDrawingPoints([]);
      setSelectedItemDescription(null);
    }
  }, [drawingPoints, selectedItemDescription]);

  // --- カルーセルアイテムの定義 ---
  const items: CarouselClickItem[] = useMemo(() => [
     {
        src: '/images/Recommend/Heart.png',
        alt: 'Heart Shape',
        description: 'ハート型',
        shapeData: heartShape,
        onClick: () => handleSelectShape({ src: '/images/Recommend/Heart.png', alt: 'Heart Shape', description: 'ハート型', shapeData: heartShape }),
    },
    {
        src: '/images/Recommend/Star.png',
        alt: 'Star Shape',
        description: '星型',
        shapeData: starShape,
        onClick: () => handleSelectShape({ src: '/images/Recommend/Star.png', alt: 'Star Shape', description: '星型', shapeData: starShape }),
    },
     {
        src: '/images/Recommend/Circle.png',
        alt: 'Circle Shape',
        description: '円型',
        shapeData: circleShape,
        onClick: () => handleSelectShape({ src: '/images/Recommend/Circle.png', alt: 'Circle Shape', description: '円型', shapeData: circleShape }),
    },
  ], [handleSelectShape]);

  // --- ページ読み込み時の処理 ---
  useEffect(() => {
    // ... (変更なし) ...
    console.log('初回レンダリング: localStorage を確認します');
    try {
      const savedData = localStorage.getItem('drawingPointsData');
      if (savedData) {
        console.log('localStorage にデータがありました:', savedData);
        const parsedPoints = JSON.parse(savedData) as Point[];
        setDrawingPoints(parsedPoints);
        let foundMatch = false;
        if (JSON.stringify(heartShape) === JSON.stringify(parsedPoints)) {
            console.log('マッチするおすすめ図形: ハート型');
            setSelectedItemDescription('ハート型');
            foundMatch = true;
        } else if (JSON.stringify(starShape) === JSON.stringify(parsedPoints)) {
             console.log('マッチするおすすめ図形: 星型');
             setSelectedItemDescription('星型');
             foundMatch = true;
        } else if (JSON.stringify(circleShape) === JSON.stringify(parsedPoints)) {
             console.log('マッチするおすすめ図形: 円型');
             setSelectedItemDescription('円型');
             foundMatch = true;
        }
        if (!foundMatch) {
            console.log('手描きデータとして復元します');
            setSelectedItemDescription(null);
        }
      } else {
          console.log('localStorage にデータはありませんでした');
      }
    } catch (error) {
      console.error("Failed to initialize drawing points from localStorage:", error);
      localStorage.removeItem('drawingPointsData');
    }
  }, []);

  // --- 手描き完了時の処理 ---
  const handleDrawEnd = useCallback((points: Point[]) => {
    // ... (変更なし) ...
    if (points.length > 0) {
      console.log('手描き完了: localStorage に保存します');
      try {
        localStorage.setItem('drawingPointsData', JSON.stringify(points));
        setDrawingPoints(points);
        setSelectedItemDescription(null);
        console.log('手描きデータ保存完了');
      } catch (error) {
        console.error("Failed to save drawn points to localStorage:", error);
        alert('描画データの保存に失敗しました。');
      }
    } else if (selectedItemDescription === null) {
        console.log('手描き完了 (空) または Canvasクリア: データをクリアします');
        localStorage.removeItem('drawingPointsData');
        setDrawingPoints([]);
    } else {
        console.log('onDrawEnd([]) が呼ばれましたが、図形選択中のためデータは維持します');
    }
  }, [selectedItemDescription]);

  // --- クリア処理 ---
  const handleClear = useCallback(() => {
    // ... (変更なし) ...
     console.log('クリアボタンクリック: データをクリアします');
    setClearTrigger(prev => prev + 1);
    setDrawingPoints([]);
    setSelectedItemDescription(null);
    try {
        localStorage.removeItem('drawingPointsData');
        console.log('localStorage クリア完了');
    } catch (error) {
        console.error("Failed to remove drawing points from localStorage:", error);
    }
  }, []);

  // --- 次へ進む処理 ---
  const navigateToCondition = useCallback(() => {
    // ... (変更なし) ...
     if (drawingPoints.length >= 2) {
      console.log('条件設定へ進む: データがあるので遷移します', drawingPoints);
      try {
          localStorage.setItem('drawingPointsData', JSON.stringify(drawingPoints));
      } catch (error) {
           console.error("Failed to save drawing points before navigating:", error);
      }
      router.push('/condition');
    } else {
      console.log('条件設定へ進む: データがないためアラートを表示');
      alert('コースの形を描くか、おすすめから選択してください。');
    }
  }, [drawingPoints, router]);

  // デバッグ用 useEffect (変更なし)
  useEffect(() => {
      console.log('State Updated:', { drawingPointsLength: drawingPoints.length, selectedItemDescription });
  }, [drawingPoints, selectedItemDescription]);

  const isCanvasDisabled = selectedItemDescription !== null;

  return (
      // ★★★ main 要素に p-4 を適用 ★★★
      <main className="flex min-h-screen flex-col items-center justify-start p-4"> {/* justify-center を justify-start に変更 (任意) */}
      {/* ★★★ max-w-5xl から max-w-md に変更 (スマホ想定) ★★★ */}
      <div className="z-10 w-full max-w-md items-center justify-center text-sm">
          {/* ★★★ この div から px-4 を削除 ★★★ */}
          <div className="text-center mb-4">
              <Title title="コースの形を描く" />
              <div className="z-10 w-full self-start mt-2"> {/* mt-2 を追加 */}
                  <BackButton text="ホームに戻る" to="/home" />
              </div>
              <div className="w-full aspect-[1] mt-4 flex justify-center">
                  <DrawingCanvas
                      strokeWidth={6}
                      strokeColor="#FF0000"
                      onDrawEnd={handleDrawEnd}
                      initialPoints={undefined}
                      clearSignal={clearTrigger}
                      disabled={isCanvasDisabled}
                  />
              </div>

              <div className="mt-4 text-black"> {/* クリアボタンの下に移動 */}
                  <Header headerText="おすすめから選ぶ" />
              </div>
              {/* ★★★ カルーセルのコンテナから p-4 を削除 ★★★ */}
              <div className="">
                  <CarouselWithClick
                      items={items}
                      selectedDescription={selectedItemDescription}
                  />
              </div>

              {/* ★★★ クリアボタンをカルーセルの下に移動 ★★★ */}
              <div className="flex justify-center space-x-4 mt-6"> {/* mt を調整 */}
                  <ClearCanvasButton
                      onClick={handleClear}
                      buttonText="やり直す"
                      disabled={isClearButtonDisabled}
                  />
              </div>

              <div className="mt-8 flex justify-center">
                  <RoutingButton
                      buttonText="条件設定へ進む"
                      onClick={navigateToCondition}
                      disabled={drawingPoints.length < 2}
                  />
              </div>
          </div>
      </div>
      </main>
  );
}