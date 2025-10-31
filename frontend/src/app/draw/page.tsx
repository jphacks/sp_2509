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

// ★ 修正: 形状データを外部ファイルからインポート
import { heartShape, starShape, circleShape, musicNoteShape } from '../../recommendShape/shapes';

// --- Draw コンポーネント本体 ---
export default function Draw() {
  const [userDrawnPoints, setUserDrawnPoints] = useState<Point[]>([]);
  const [selectedShape, setSelectedShape] = useState<{ description: string; points: Point[] } | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const router = useRouter();

  const activePoints = useMemo(() => selectedShape?.points ?? userDrawnPoints, [selectedShape, userDrawnPoints]);
  const activeDescription = useMemo(() => selectedShape?.description ?? null, [selectedShape]);

// ★ 修正: localStorageへの保存処理を削除 (変更なし)
  const handleSelectShape = useCallback((item: CarouselClickItem) => {
    if (!item.shapeData) {
      console.warn("選択されたアイテムに shapeData がありません:", item.description);
      return;
    }
    // 状態の更新のみ行う
    setSelectedShape({ description: item.description, points: item.shapeData });
    console.log(`選択: ${item.description}. 状態を更新しました。(localStorageには保存しません)`);
  }, []);

  const items: CarouselClickItem[] = useMemo(() => [
    {
      src: '/images/Recommend/Heart.png',
      alt: 'Heart Shape',
      description: 'ハート',
      shapeData: heartShape,
      onClick: () => handleSelectShape({ src: '/images/Recommend/Heart.png', alt: 'Heart Shape', description: 'ハート', shapeData: heartShape }),
    },
    {
      src: '/images/Recommend/Star.png',
      alt: 'Star Shape',
      description: '星',
      shapeData: starShape,
      onClick: () => handleSelectShape({ src: '/images/Recommend/Star.png', alt: 'Star Shape', description: '星', shapeData: starShape }),
    },
    {
      src: '/images/Recommend/Circle.png',
      alt: 'Circle Shape',
      description: '円',
      shapeData: circleShape,
      onClick: () => handleSelectShape({ src: '/images/Recommend/Circle.png', alt: 'Circle Shape', description: '円', shapeData: circleShape }),
    },
    // ★ 修正: 音符データをリストに追加 (画像パスは適宜調整してください)
    {
      src: '/images/Recommend/Circle.png', // 例: /images/Recommend/MusicNote.png
      alt: 'Music Note Shape',
      description: '音符',
      shapeData: musicNoteShape,
      onClick: () => handleSelectShape({ 
        src: '/images/Recommend/Circle.png', 
        alt: 'Music Note Shape', 
        description: '音符', 
        shapeData: musicNoteShape 
      }),
    },
  ], [handleSelectShape]);

// ★ 修正: ページ読み込み時のlocalStorage復元ロジック (変更なし)
  useEffect(() => {
    console.log('初回レンダリング: localStorage を確認します');
    let needsClearLocalStorage = false;
    try {
      const savedData = localStorage.getItem('drawingPointsData');
      if (savedData) {
        console.log('localStorage にデータがありました:', savedData);
        const parsedPoints = JSON.parse(savedData) as Point[];

        // 保存データがおすすめ図形と一致するかチェック
        const isHeart = JSON.stringify(heartShape) === JSON.stringify(parsedPoints);
        const isStar = JSON.stringify(starShape) === JSON.stringify(parsedPoints);
        const isCircle = JSON.stringify(circleShape) === JSON.stringify(parsedPoints);
        // ★ 修正: 音符もチェック対象に追加
        const isMusicNote = JSON.stringify(musicNoteShape) === JSON.stringify(parsedPoints);

        if (isHeart || isStar || isCircle || isMusicNote) { // ★ 修正
          // おすすめ図形データだったので、選択状態は復元せず、localStorageをクリア対象にする
          console.log('保存されていたのはおすすめ図形なので、選択状態はリセットします。');
          needsClearLocalStorage = true; // localStorageを後でクリア
          setUserDrawnPoints([]); // 手描きデータはクリア
          setSelectedShape(null); // 選択状態もクリア
        } else if (parsedPoints && parsedPoints.length > 0) {
          // 手描きデータとして復元
          console.log('手描きデータとして復元します');
          setUserDrawnPoints(parsedPoints);
          setSelectedShape(null); // おすすめ選択は解除
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
       // おすすめ図形データがlocalStorageに残っていた場合、ここで削除
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
  }, []); // 初回マウント時のみ実行

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
      console.log('条件設定へ進む: データがあるので遷移します', activePoints);
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

  // ★ 追加: ガイドテキストを表示するかどうかのフラグ (変更なし)
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
              initialPoints={undefined} // initialPoints は直接は使わず、useEffect で復元するため undefined のまま
              clearSignal={clearTrigger}
              showGuideText={shouldShowGuideText} // ★ 修正: 計算したフラグを渡す
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
              disabled={isClearButtonDisabled} // ★ やり直しボタンのdisabled条件も見直しが必要なら修正
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