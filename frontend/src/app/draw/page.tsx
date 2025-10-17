'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react'; // useCallback を追加
import DrawingCanvas from '../../components/DrawingCanvas';
import Title from '../../components/title';
import Header from '../../components/Header';
import RoutingButton from '../../components/routingButton';
import ClearCanvasButton from '../../components/ClearCanvasButton'; // ★★★ 追加: クリアボタンをインポート
import { FaRoute, FaHeart } from "react-icons/fa"; // FaHeart を追加 (例)

interface Point {
    x: number;
    y: number;
}

// 例: ハート型の座標配列 (ダミー)
const heartShape: Point[] = [
    { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
    { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
    { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 }
].map(p => ({ x: p.x * 350 / 300, y: p.y * 350 / 300 })); // サイズに合わせて調整


export default function Draw() {
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [selectedShape, setSelectedShape] = useState<Point[] | undefined>(undefined);
  const isClearButtonDisabled = drawingPoints.length === 0 && !selectedShape;

  const router = useRouter(); // useRouterを初期化

    // handleDrawEnd を useCallback でメモ化
  const handleDrawEnd = useCallback((points: Point[]) => {
    console.log("Draw/Clear ended in parent:", points);
    setDrawingPoints(points);
    // クリアされた場合 (pointsが空配列) は選択された図形もリセット
    if (points.length === 0) {
        setSelectedShape(undefined);
    }
  }, []); // 依存配列は空

  const handleClear = () => {
    console.log("Clear button clicked"); // デバッグ用
    setClearTrigger(prev => prev + 1); // トリガーの数値を変更してuseEffectを発火させる
    setDrawingPoints([]); // 親の座標データもクリア
  };
  
  // プリセット図形選択関数例（ハート型）
  const selectHeart = () => {
    console.log("Selecting Heart shape");

    setSelectedShape(heartShape);

};



    // 遷移関数
    const navigateToCondition = () => {
    router.push('/condition');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
            <div className="text-center">
                <Title title="コースの形を描く" />


                <div className="mt-10 flex justify-center">
                    <DrawingCanvas
                    width={600}
                    height={400}
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

                    <div className="mt-6 flex justify-center space-x-4">
                                            <button
                            onClick={selectHeart}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-sm shadow transition-colors duration-150 ease-in-out ${selectedShape === heartShape ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            <FaHeart /> <span>Heart Shape</span>
                        </button>
                    </div>  
                    
                    {/* ボタンによるページ遷移 */}
                    <button
                        onClick={navigateToCondition}
                        className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                    >
                        Go to Condition Page (Button)
                    </button>


            </div>
        </div>
        </main>
    );
}