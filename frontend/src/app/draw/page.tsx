'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react'; // useCallback を追加
import DrawingCanvas from '../../components/DrawingCanvas';
import Title from '../../components/Title';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import BackButton from '../../components/BackButton';
import RoutingButton from '../../components/RoutingButton';
import ClearCanvasButton from '../../components/ClearCanvasButton'; // ★★★ 追加: クリアボタンをインポート
import RecommendedShape from '../../components/RecommendedShape';
import type { Point } from '../../types/types';


// 例: ハート型の座標配列 (ダミー)
const heartShape: Point[] = [
    { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
    { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
    { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 }
];


export default function Draw() {
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [selectedShape, setSelectedShape] = useState<Point[] | undefined>(undefined);
  const isClearButtonDisabled = drawingPoints.length === 0 && !selectedShape;

  const router = useRouter(); // useRouterを初期化

    // handleDrawEnd を useCallback でメモ化
  const handleDrawEnd = useCallback((points: Point[]) => {
    setDrawingPoints(points);
    // クリアされた場合 (pointsが空配列) は選択された図形もリセット
    if (points.length === 0) {
        setSelectedShape(undefined);
    }
  }, []); // 依存配列は空

  const handleClear = () => {
    setClearTrigger(prev => prev + 1); // トリガーの数値を変更してuseEffectを発火させる
    setDrawingPoints([]); // 親の座標データもクリア
  };
  
  // プリセット図形選択関数例（ハート型）
  const selectHeart = () => {

    setSelectedShape(heartShape);

};



const navigateToCondition = () => {
    try {
      // drawingPoints を JSON 文字列に変換して localStorage に保存
      localStorage.setItem('drawingPointsData', JSON.stringify(drawingPoints));
      router.push('/condition');
    } catch (error) {
      console.error("Failed to save drawing points to localStorage:", error);
    }
  };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
            <div className="text-center px-4 mb-4">
                <Title title="コースの形を描く" />

                <div className="z-10 w-full self-start">
                    <BackButton text="ホームに戻る" to="/home" />
                </div>

                <div className="w-full aspect-[1/3] mt-4 flex justify-center">
                    <DrawingCanvas
                    strokeWidth = {6}
                    strokeColor = "#FF0000"
                    onDrawEnd={handleDrawEnd}
                    initialPoints={selectedShape}
                    clearSignal={clearTrigger}
                    />
                    </div>

                    <div className="flex justify-center space-x-4 mt-2">
                        <ClearCanvasButton
                        onClick={handleClear}
                        buttonText="書き直す"
                        disabled={isClearButtonDisabled}
                        />
                    </div>

                    <div className="mt-4 text-black">
                        <Header headerText="おすすめから選ぶ" />
                    </div>
                    <div className="flex justify-center space-x-4 mt-4">
                        <button
                            onClick={selectHeart}
                            className={"flex items-center justify-center rounded transition-colors duration-150 ease-in-out"}
                        >
                            <RecommendedShape shapeImageSrc='/images/testHeart.png'/>
                        </button>
                    </div>  
                    
                    {/* ボタンによるページ遷移 */}
                    <RoutingButton
                        buttonText="条件設定へ進む"
                        onClick={navigateToCondition} // onClick で関数を渡す
                        disabled={drawingPoints.length === 0} // disabled 状態を渡す
                        // to プロパティは不要
                    />

                    <Loading loadingText='読み込み中' points={drawingPoints}/>

            </div>
        </div>
        </main>
    );
}