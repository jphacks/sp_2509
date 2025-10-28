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
import SelectedShapePlaceholder from '../../components/SelectedShapePlaceholder';

// --- 図形データ定義 ---
// (heartShape, starShape, circleShape の定義は変更なし)
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
  // ★ 1. 状態を分離
  const [userDrawnPoints, setUserDrawnPoints] = useState<Point[]>([]); // ユーザーが描画した線
  const [selectedShape, setSelectedShape] = useState<{ description: string; points: Point[] } | null>(null); // 選択されたおすすめ図形
  const [clearTrigger, setClearTrigger] = useState(0); // Canvasクリア用
  const router = useRouter();

  // ★ 2. アクティブなポイントを決定するロジック
  // おすすめが選択されていればそれを、そうでなければユーザー描画を使う
  const activePoints = useMemo(() => selectedShape?.points ?? userDrawnPoints, [selectedShape, userDrawnPoints]);
  const activeDescription = useMemo(() => selectedShape?.description ?? null, [selectedShape]);

  // ★ 3. カルーセルアイテムクリック時の処理変更
  const handleSelectShape = useCallback((item: CarouselClickItem) => {
    if (!item.shapeData) {
      console.warn("選択されたアイテムに shapeData がありません:", item.description);
      return;
    }
    // おすすめを選択したら、選択状態を更新（ユーザー描画データは保持）
    setSelectedShape({ description: item.description, points: item.shapeData });
    // localStorage にも保存（次のページで使うため）
    try {
      localStorage.setItem('drawingPointsData', JSON.stringify(item.shapeData));
      console.log(`選択: ${item.description}. localStorage に保存しました。`);
    } catch (error) {
      console.error("Failed to save selected shape to localStorage:", error);
      alert('形状データの保存に失敗しました。');
    }
  }, []);

  // --- カルーセルアイテムの定義 (変更なし) ---
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

  // ★ 4. ページ読み込み時の処理変更
  useEffect(() => {
    console.log('初回レンダリング: localStorage を確認します');
    try {
      const savedData = localStorage.getItem('drawingPointsData');
      if (savedData) {
        console.log('localStorage にデータがありました:', savedData);
        const parsedPoints = JSON.parse(savedData) as Point[];

        // 保存データがおすすめ図形と一致するかチェック
        let matchedShape: { description: string; points: Point[] } | null = null;
        if (JSON.stringify(heartShape) === JSON.stringify(parsedPoints)) {
          matchedShape = { description: 'ハート型', points: heartShape };
        } else if (JSON.stringify(starShape) === JSON.stringify(parsedPoints)) {
          matchedShape = { description: '星型', points: starShape };
        } else if (JSON.stringify(circleShape) === JSON.stringify(parsedPoints)) {
          matchedShape = { description: '円型', points: circleShape };
        }

        if (matchedShape) {
          // おすすめ図形として復元
          console.log(`マッチするおすすめ図形: ${matchedShape.description}`);
          setSelectedShape(matchedShape);
          // ユーザー描画は空にする（もし復元したい場合は別途localStorageに保存が必要）
          setUserDrawnPoints([]);
        } else {
          // 手描きデータとして復元
          console.log('手描きデータとして復元します');
          setUserDrawnPoints(parsedPoints);
          setSelectedShape(null);
        }
      } else {
        console.log('localStorage にデータはありませんでした');
      }
    } catch (error) {
      console.error("Failed to initialize drawing points from localStorage:", error);
      localStorage.removeItem('drawingPointsData');
      setUserDrawnPoints([]);
      setSelectedShape(null);
    }
  }, []);

  // ★ 5. 手描き完了時の処理変更
  const handleDrawEnd = useCallback((points: Point[]) => {
    if (points.length > 0) {
      console.log('手描き完了: userDrawnPoints を更新し、おすすめ選択を解除します');
      setUserDrawnPoints(points);
      setSelectedShape(null); // おすすめ選択を解除
      // localStorage にも保存
      try {
        localStorage.setItem('drawingPointsData', JSON.stringify(points));
        console.log('手描きデータ保存完了');
      } catch (error) {
        console.error("Failed to save drawn points to localStorage:", error);
        alert('描画データの保存に失敗しました。');
      }
    } else {
      // 描画が空の場合 (例: クリックのみ) は何もしないか、
      // 必要なら userDrawnPoints をクリアする
      console.log('手描き完了 (空)');
      // setUserDrawnPoints([]); // 必要ならクリア
      // localStorage.removeItem('drawingPointsData'); // localStorageもクリアする場合
    }
  }, []);

  // ★ 6. やり直し（クリア）処理変更
  const handleClearDrawing = useCallback(() => {
    console.log('やり直しボタンクリック: userDrawnPoints のみをクリアします');
    setUserDrawnPoints([]); // ユーザー描画のみクリア
    setClearTrigger(prev => prev + 1); // Canvasにクリア信号を送る
    setSelectedShape(null); // おすすめ選択も解除する（仕様に応じて変更可）

    // localStorageもクリア（現在のアクティブデータが手描きだった場合）
    // おすすめ選択中の場合はlocalStorageはそのままにしておく選択肢もある
    // ここでは、アクティブが手描きでなくてもクリアする
    try {
      localStorage.removeItem('drawingPointsData');
      console.log('localStorage クリア完了');
    } catch (error) {
      console.error("Failed to remove drawing points from localStorage:", error);
    }
  }, []);

  // ★ 7. おすすめ選択解除処理（Placeholderクリック時）
  const handleDeselectShape = useCallback(() => {
    console.log('おすすめ選択を解除');
    setSelectedShape(null);
    // localStorageをユーザー描画データに戻すか、クリアするか選択
    // ここではユーザー描画データがあれば戻す
    if (userDrawnPoints.length > 0) {
      try {
        localStorage.setItem('drawingPointsData', JSON.stringify(userDrawnPoints));
        console.log('ユーザー描画データを localStorage に復元しました');
      } catch (error) {
        console.error("Failed to restore drawn points to localStorage:", error);
      }
    } else {
      localStorage.removeItem('drawingPointsData');
    }
  }, [userDrawnPoints]);

  // ★ 8. 次へ進む処理変更
  const navigateToCondition = useCallback(() => {
    // アクティブなポイント（おすすめ選択 or ユーザー描画）があるかチェック
    if (activePoints.length >= 2) {
      console.log('条件設定へ進む: データがあるので遷移します', activePoints);
      try {
        // 現在アクティブなデータをlocalStorageに保存
        localStorage.setItem('drawingPointsData', JSON.stringify(activePoints));
      } catch (error) {
        console.error("Failed to save drawing points before navigating:", error);
        // エラーがあっても遷移は試みる
      }
      router.push('/condition');
    } else {
      console.log('条件設定へ進む: データがないためアラートを表示');
      alert('コースの形を描くか、おすすめから選択してください。');
    }
  }, [activePoints, router]);

  // デバッグ用 useEffect (変更なし)
  useEffect(() => {
    console.log('State Updated:', {
      userDrawnPointsLength: userDrawnPoints.length,
      selectedShapeDescription: selectedShape?.description ?? 'None'
    });
  }, [userDrawnPoints, selectedShape]);

  // ★ 9. UI制御ロジック変更
  const isCanvasDisabled = selectedShape !== null; // おすすめ選択中ならCanvas無効
  // やり直しボタンは、ユーザー描画がある場合のみ有効
  const isClearButtonDisabled = userDrawnPoints.length === 0;
  // 次へボタンは、アクティブなポイントがある場合のみ有効
  const isNextButtonDisabled = activePoints.length < 2;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4">
      <div className="z-10 w-full max-w-md items-center justify-center text-sm">
        <div className="text-center mb-4">
          <Title title="コースの形を描く" />
          <div className="z-10 w-full self-start mt-2">
            <BackButton text="ホームに戻る" to="/home" />
          </div>
          <div className="w-full aspect-[1] mt-4 relative"> {/* relative はそのまま */}
            {/* DrawingCanvas は常に表示 */}
            <DrawingCanvas
              strokeWidth={6}
              strokeColor="#f4551fff"
              onDrawEnd={handleDrawEnd}
              initialPoints={undefined}
              clearSignal={clearTrigger}
              //disabled={isCanvasDisabled}
            />
            {/* isCanvasDisabled が true の場合にオーバーレイとプレースホルダーを表示 */}
            {isCanvasDisabled && (
              <>
                {/* 薄暗いオーバーレイ */}
                <div className="absolute inset-0 w-full h-full bg-gray-300 bg-opacity-300 rounded-lg mix-blend-multiply z-10"></div> {/* ★ 半透明の黒いオーバーレイを追加 (z-10) */}
                {/* SelectedShapePlaceholder (オーバーレイより手前に表示) */}
                <SelectedShapePlaceholder
                  className="absolute inset-0 w-full h-full z-20" // ★ z-20 はそのまま
                  message={`${activeDescription} を選択中`}
                  onClick={handleDeselectShape}
                />
              </>
            )}
          </div>

          {/* ★ やり直しボタン */}
          <div className="flex justify-center space-x-4 mt-6">
            <ClearCanvasButton
              onClick={handleClearDrawing} // ★ 描画のみクリアする関数を呼ぶ
              buttonText="描き直す"
              disabled={isClearButtonDisabled} // ★ ユーザー描画がなければ無効
            />
          </div>

          <div className="mt-4 text-black">
            <Header headerText="おすすめから選ぶ" />
          </div>
          <div className="">
            <CarouselWithClick
              items={items}
              selectedDescription={activeDescription} // ★ アクティブな説明を渡す
            />
          </div>



          {/* ★ 次へボタン */}
          <div className="mt-8 flex justify-center">
            <RoutingButton
              buttonText="条件設定へ進む"
              onClick={navigateToCondition}
              disabled={isNextButtonDisabled} // ★ アクティブなデータがなければ無効
            />
          </div>
        </div>
      </div>
    </main>
  );
}