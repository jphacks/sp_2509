// frontend/src/app/draw/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import DrawingCanvas from "../../components/DrawingCanvas";
import Title from "../../components/Title";
import Header from "../../components/Header";
// import Loading from '../../components/Loading'; // Loadingは一旦コメントアウト
import BackButton from "../../components/BackButton";
import RoutingButton from "../../components/RoutingButton";
import ClearCanvasButton from "../../components/ClearCanvasButton";
import RecommendedShape from "../../components/RecommendedShape";
import type { Point } from "../../types/types";

// 例: ハート型の座標配列 (ダミー)
const heartShape: Point[] = [
  { x: 175, y: 100 },
  { x: 205, y: 70 },
  { x: 235, y: 80 },
  { x: 250, y: 110 },
  { x: 235, y: 140 },
  { x: 175, y: 210 },
  { x: 115, y: 140 },
  { x: 100, y: 110 },
  { x: 115, y: 80 },
  { x: 145, y: 70 },
  { x: 175, y: 100 },
];

export default function Draw() {
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [selectedShape, setSelectedShape] = useState<Point[] | undefined>(
    undefined
  );
  const isClearButtonDisabled = drawingPoints.length === 0 && !selectedShape;

  const router = useRouter();

  const handleDrawEnd = useCallback((points: Point[]) => {
    setDrawingPoints(points);
    if (points.length === 0) {
      setSelectedShape(undefined);
    }
  }, []);

  const handleClear = () => {
    setClearTrigger((prev) => prev + 1);
    setDrawingPoints([]);
    setSelectedShape(undefined); // おすすめ選択もリセット
  };

  const selectHeart = () => {
    handleClear(); // 既存の描画をクリア
    // 少し遅延させて initialPoints を確実に反映させる
    setTimeout(() => {
      setSelectedShape(heartShape);
      setDrawingPoints(heartShape); // 描画点も更新
    }, 0);
  };

  const navigateToCondition = () => {
    try {
      const pointsToSave = selectedShape || drawingPoints; // 選択された形状があればそれを優先
      if (pointsToSave.length === 0) {
        alert("コースの形状がありません。");
        return;
      }
      localStorage.setItem("drawingPointsData", JSON.stringify(pointsToSave));
      router.push("/condition");
    } catch (error) {
      console.error("Failed to save drawing points to localStorage:", error);
    }
  };

  const paddingX = "px-4"; // homeに合わせた左右パディング
  const paddingTop = "pt-8";
  const paddingBottom = "pb-12";

  return (
    // <main className="flex min-h-screen flex-col items-center justify-center p-4"> // 修正前
    <main
      className={`flex flex-col ${paddingTop} ${paddingBottom} max-w-md mx-auto min-h-screen`}
    >
      {" "}
      {/* 修正後 */}
      {/* <div className="z-10 w-full max-w-5xl items-center justify-center text-sm"> */}{" "}
      {/* 修正前 */}
      <div className={`${paddingX} flex flex-col flex-grow gap-y-6`}>
        {" "}
        {/* 修正後: flex-grow追加、gap調整 */}
        {/* <div className="text-center px-4 mb-4"> */} {/* 修正前 */}
        <div className="text-left">
          {" "}
          {/* 修正後: text-left */}
          <Title title="コースの形を描く" />
          {/* <div className="z-10 w-full self-start"> */} {/* 修正前 */}
          <div className="mt-2">
            {" "}
            {/* 修正後: マージン調整 */}
            <BackButton text="ホームに戻る" to="/home" />
          </div>
        </div>
        <div className="w-full aspect-[1] flex justify-center">
          <DrawingCanvas
            strokeWidth={6}
            strokeColor="#FF0000"
            onDrawEnd={handleDrawEnd}
            initialPoints={selectedShape}
            clearSignal={clearTrigger}
          />
        </div>
        <div className="flex justify-center space-x-4">
          <ClearCanvasButton
            onClick={handleClear}
            buttonText="書き直す"
            disabled={isClearButtonDisabled}
          />
        </div>
        <div>
          {" "}
          {/* おすすめセクションをdivで囲む */}
          <Header headerText="おすすめから選ぶ" />
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={selectHeart}
              className={
                "flex items-center justify-center rounded transition-colors duration-150 ease-in-out"
              }
            >
              <RecommendedShape shapeImageSrc="/images/testHeart.png" />
            </button>
          </div>
        </div>
        {/* Loadingはデバッグ用に残す場合はここ */}
        {/* <Loading loadingText='読み込み中' points={drawingPoints}/> */}
        {/* </div> */} {/* 修正前: text-center px-4 mb-4 の閉じタグ */}
      </div>{" "}
      {/* 修正後: px-4 flex flex-col ... の閉じタグ */}
      {/* ボタンによるページ遷移 */}
      <div className={`mt-auto ${paddingX} w-full pt-10`}>
        {" "}
        {/* 修正後: homeに合わせた配置 */}
        <RoutingButton
          buttonText="条件設定へ進む"
          onClick={navigateToCondition}
          disabled={drawingPoints.length === 0 && !selectedShape} // おすすめ選択も考慮
        />
      </div>
    </main>
  );
}
