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
import { GrConfigure } from "react-icons/gr";

// ★ ステップ1: 自動生成されたすべての図形をインポート
import * as generatedShapes from '../../lib/generated-shapes';

// ★ ステップ2: 図形の「設定マップ」を定義
// ビルドスクリプトが生成する変数名 (例: heartShape) をキーとして、
// UIで必要な情報 (description, src) をマッピングします。
//
// 新しい図形を追加する場合：
// 1. `src/assets/svg` にSVGファイル (例: 'crescent.svg') を置く。
// 2. `npm run dev` を実行 (crescentShape と crescent.png が自動生成される)。
// 3. このマップに `crescentShape: { ... }` のエントリを追加する。
const shapeConfig: Record<string, { description: string; src: string }> = {
  heartShape: {
    description: 'ハート',
    src: '/images/Recommend/heart.png',
  },
  starShape: {
    description: '星',
    src: '/images/Recommend/star.png',
  },
  circleShape: {
    description: '円',
    src: '/images/Recommend/circle.png',
  },
  musicNoteShape: {
    description: '音符',
    src: '/images/Recommend/musicNote.png',
  },
  crescentShape: {
    description: '三日月',
    src: '/images/Recommend/crescent.png',
  },
};


// --- Draw コンポーネント本体 ---
export default function Draw() {
  const [userDrawnPoints, setUserDrawnPoints] = useState<Point[]>([]);
  const [selectedShape, setSelectedShape] = useState<{ description: string; points: Point[] } | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const router = useRouter();

  const activePoints = useMemo(() => selectedShape?.points ?? userDrawnPoints, [selectedShape, userDrawnPoints]);
  const activeDescription = useMemo(() => selectedShape?.description ?? null, [selectedShape]);

  // handleSelectShape は変更なし
  const handleSelectShape = useCallback((item: CarouselClickItem) => {
    if (!item.shapeData) {
      console.warn("選択されたアイテムに shapeData がありません:", item.description);
      return;
    }
    setSelectedShape({ description: item.description, points: item.shapeData });
    console.log(`選択: ${item.description}.`);
  }, []);

  // ★ ステップ3: `items` 配列を `shapeConfig` と `generatedShapes` から動的に生成
  const items: CarouselClickItem[] = useMemo(() => {
    return Object.entries(shapeConfig).map(([shapeKey, config]) => {
      // shapeKey は 'heartShape', 'starShape' など
      // config は { description: 'ハート', src: '...' }
      
      const shapeData = (generatedShapes as Record<string, Point[]>)[shapeKey];
      
      const item: CarouselClickItem = {
        src: config.src,
        alt: `${config.description} Shape`,
        description: config.description,
        shapeData: shapeData || [], // 念のためフォールバック
      };
      
      // onClickハンドラを動的に設定
      item.onClick = () => handleSelectShape(item);
      
      return item;
    });
  }, [handleSelectShape]); // handleSelectShape は useCallback でラップされているのでOK

  // ★ ステップ4: useEffect の localStorage チェックを動的に修正
  useEffect(() => {
    console.log('初回レンダリング: localStorage を確認します');
    let needsClearLocalStorage = false;
    
    // generated-shapesからすべての図形データ(Point[])の配列を取得
    const allShapeData = Object.values(generatedShapes) as Point[][];
    const allShapeDataStrings = allShapeData.map(points => JSON.stringify(points));

    try {
      const savedData = localStorage.getItem('drawingPointsData');
      if (savedData) {
        // console.log('localStorage にデータがありました:', savedData);
        
        // JSON.parse が失敗するケースを考慮
        let parsedPoints: Point[];
        try {
            parsedPoints = JSON.parse(savedData) as Point[];
        } catch (e) {
            console.error("localStorage データのJSONパースに失敗:", e);
            needsClearLocalStorage = true; // 壊れたデータは削除
            return;
        }

        const savedDataString = JSON.stringify(parsedPoints); // 比較用に再文字列化

        // ★ 保存されているデータが、おすすめ図形のいずれかと一致するかを some でチェック
        const isRecommendedShape = allShapeDataStrings.some(
          shapeString => shapeString === savedDataString
        );

        if (isRecommendedShape) {
          // おすすめ図形データだったので、選択状態は復元せず、localStorageをクリア対象にする
          console.log('保存されていたのはおすすめ図形なので、選択状態はリセットします。');
          needsClearLocalStorage = true;
          setUserDrawnPoints([]);
          setSelectedShape(null);
        } else if (parsedPoints && parsedPoints.length > 0) {
          // 手描きデータとして復元
          console.log('手描きデータとして復元します');
          setUserDrawnPoints(parsedPoints);
          setSelectedShape(null);
        } else {
           // データが空または無効だった場合
           setUserDrawnPoints([]);
           setSelectedShape(null);
        }
      } else {
        // localStorageにデータがなかった場合
        console.log('localStorage にデータはありませんでした');
        setUserDrawnPoints([]);
        setSelectedShape(null);
      }
    } catch (error) {
      console.error("Failed to initialize drawing points from localStorage:", error);
      needsClearLocalStorage = true; // エラー時もlocalStorageクリアを試みる
      setUserDrawnPoints([]);
      setSelectedShape(null);
    } finally {
       if (needsClearLocalStorage) {
           try {
               localStorage.removeItem('drawingPointsData');
               console.log('不要なlocalStorageデータ（おすすめ図形）をクリアしました。');
           } catch (clearError) {
               console.error("Failed to clear localStorage:", clearError);
           }
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行 (依存配列は空のままでOK)


  // --- 残りのロジック (変更なし) ---

  const handleDrawEnd = useCallback((points: Point[]) => {
    if (points.length > 0) {
      console.log('手描き完了: userDrawnPoints を更新し、おすすめ選択を解除します');
      setUserDrawnPoints(points);
      setSelectedShape(null);
      try {
        localStorage.setItem('drawingPointsData', JSON.stringify(points));
        console.log('手描きデータ保存完了');
      } catch (error) {
        console.error("Failed to save drawn points to localStorage:", error);
        alert('描画データの保存に失敗しました。');
      }
    } else {
      console.log('手描き完了 (空)');
    }
  }, []);

  const handleClearDrawing = useCallback(() => {
    console.log('やり直しボタンクリック: userDrawnPoints のみをクリアします');
    setUserDrawnPoints([]);
    setClearTrigger(prev => prev + 1);
    setSelectedShape(null);
    try {
      localStorage.removeItem('drawingPointsData');
      console.log('localStorage クリア完了');
    } catch (error) {
      console.error("Failed to remove drawing points from localStorage:", error);
    }
  }, []);

  const handleDeselectShape = useCallback(() => {
    console.log('おすすめ選択を解除');
    setSelectedShape(null);
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

  const navigateToCondition = useCallback(() => {
    if (activePoints.length >= 2) {
      console.log('条件設定へ進む: データがあるので遷移します');
      try {
        localStorage.setItem('drawingPointsData', JSON.stringify(activePoints));
      } catch (error) {
        console.error("Failed to save drawing points before navigating:", error);
      }
      router.push('/condition');
    } else {
      console.log('条件設定へ進む: データがないためアラートを表示');
      alert('コースの形を描くか、おすすめから選択してください。');
    }
  }, [activePoints, router]);

  useEffect(() => {
    console.log('State Updated:', {
      userDrawnPointsLength: userDrawnPoints.length,
      selectedShapeDescription: selectedShape?.description ?? 'None'
    });
  }, [userDrawnPoints, selectedShape]);

  const isCanvasDisabled = selectedShape !== null;
  const isClearButtonDisabled = userDrawnPoints.length === 0 && selectedShape === null;
  const isNextButtonDisabled = activePoints.length < 2;

  const shouldShowGuideText = selectedShape === null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4">
      <div className="z-10 w-full max-w-md items-center justify-center text-sm">
        <div className="text-center mb-4">
          <Title title="コースの形を描く" />
          <div className="z-10 w-full self-start mt-2">
            <BackButton text="ホームに戻る" to="/home" />
          </div>
          <div className="w-full aspect-[1] mt-4 relative">
            <DrawingCanvas
              strokeWidth={6}
              strokeColor="#f4541fff"
              onDrawEnd={handleDrawEnd}
              initialPoints={undefined}
              clearSignal={clearTrigger}
              showGuideText={shouldShowGuideText}
            />
            {isCanvasDisabled && (
              <>
                <div className="absolute inset-0 w-full h-full bg-gray-300 bg-opacity-30 rounded-lg mix-blend-multiply z-10"></div>
                <SelectedShapePlaceholder
                  className="absolute inset-0 w-full h-full font-bold z-20"
                  message={`おすすめを選択中`}
                  onClick={handleDeselectShape}
                />
              </>
            )}
          </div>

          <div className="flex justify-center space-x-4 mt-6 ">
            <ClearCanvasButton
              onClick={handleClearDrawing}
              buttonText="描き直す"
              disabled={isClearButtonDisabled}
            />
          </div>

          <div className="mt-4 text-black">
            <Header headerText="おすすめから選ぶ" />
          </div>
          <div className="">
            <CarouselWithClick
              items={items}
              selectedDescription={activeDescription}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <RoutingButton
              buttonText="条件設定へ進む"
              onClick={navigateToCondition}
              disabled={isNextButtonDisabled}
              icon={GrConfigure}
            />
          </div>
        </div>
      </div>
    </main>
  );
}