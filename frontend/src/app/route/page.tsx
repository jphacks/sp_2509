// frontend/src/app/route/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import BackButton from "@/components/BackButton"; // BackButtonをインポート
import { FaPencilAlt, FaCog, FaSave } from "react-icons/fa";

const API_URL = "/api";

type RoutePoint = {
  lat: number;
  lng: number;
};

type ResponseData = {
  total_distance_km: number;
  route_points: RoutePoint[];
  drawing_points: RoutePoint[];
};

export default function CourseDetailPage() {
  const [routeData, setRouteData] = useState<ResponseData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const responsePointsData = localStorage.getItem("responsePointsData");
    // drawingPointsData は responsePointsData に含まれるので不要

    if (responsePointsData) {
      try {
        const parsedData = JSON.parse(responsePointsData);
        const finalData: ResponseData = {
          total_distance_km: parsedData.total_distance_km || 0,
          route_points: parsedData.route_points || [],
          drawing_points:
            parsedData.drawing_points || parsedData.route_points || [], // フォールバック
        };
        setRouteData(finalData);
      } catch (error) {
        console.error("ローカルストレージのデータ解析に失敗しました:", error);
        // エラー時の処理 (例: ホームに戻す)
        // router.push("/home");
      }
    } else {
      // データがない場合 (例: 直接アクセスされた場合)
      console.warn("コースデータがローカルストレージに見つかりません。");
      // router.push("/home"); // 必要であればホームに戻す
    }
  }, [router]);

  const handleSaveCourse = async () => {
    if (!routeData || isSaving) return;
    setIsSaving(true);
    try {
      const userId = localStorage.getItem("uuid");
      if (!userId) {
        alert("ユーザー情報が見つかりません");
        setIsSaving(false);
        return;
      }
      const response = await fetch(`${API_URL}/users/${userId}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_distance_km: routeData.total_distance_km,
          route_points: routeData.route_points,
          drawing_points: routeData.drawing_points,
          is_favorite: false, // 新規作成時はfalse固定
        }),
      });

      if (response.ok) {
        localStorage.removeItem("responsePointsData");
        // localStorage.removeItem("drawingPointsData"); // 不要
        router.push("/home");
      } else {
        const errorData = await response.json();
        alert(`保存に失敗しました: ${errorData.detail || "不明なエラー"}`);
        setIsSaving(false);
      }
    } catch (error) {
      console.error("コース保存エラー:", error);
      alert("保存中にエラーが発生しました");
      setIsSaving(false);
    }
  };

  const paddingX = "px-4"; // homeに合わせた左右パディング
  const paddingTop = "pt-8";
  const paddingBottom = "pb-12";

  // routeData が null の場合の表示
  if (!routeData) {
    return (
      //   <div className="bg-gray-50 min-h-screen"> // 修正前
      <div className="text-black min-h-screen">
        {" "}
        {/* 修正後: homeに合わせる */}
        {/* <main className="max-w-md mx-auto p-4"> */} {/* 修正前 */}
        <main
          className={`flex flex-col ${paddingTop} ${paddingBottom} max-w-md mx-auto min-h-screen`}
        >
          {" "}
          {/* 修正後 */}
          <div className={`${paddingX} text-left mb-6`}>
            <Title title="コース詳細" />
            <div className="mt-2">
              <BackButton text="ホームに戻る" to="/home" />{" "}
              {/* ホームに戻るボタンを追加 */}
            </div>
          </div>
          <div className={`${paddingX} text-center py-8`}>
            <p className="text-gray-600">
              コースデータを読み込めませんでした。
            </p>
          </div>
        </main>
      </div>
    );
  }

  // routeData がある場合の表示
  return (
    // <div className="bg-gray-50 min-h-screen"> // 修正前
    <div className="text-black min-h-screen">
      {" "}
      {/* 修正後: homeに合わせる */}
      {/* <main className="max-w-md mx-auto p-4"> */} {/* 修正前 */}
      <main
        className={`flex flex-col ${paddingTop} ${paddingBottom} max-w-md mx-auto min-h-screen`}
      >
        {" "}
        {/* 修正後 */}
        <div className={`${paddingX} flex flex-col flex-grow gap-y-6`}>
          {" "}
          {/* 修正後: px-4, flex-grow, gap追加 */}
          <div className="text-left">
            {" "}
            {/* 修正後: text-left */}
            <Title title="コース詳細" />
            {/* 戻るボタンは不要なので削除 */}
          </div>
          {/* <div className="px-4"> */} {/* 修正前 */}
          <div>
            {" "}
            {/* 修正後: px-4は親で指定 */}
            <MadeRouteCard_Big routeData={routeData} />
          </div>
        </div>
        {/* <div className="px-4 mt-6 space-y-4"> */} {/* 修正前 */}
        <div className={`mt-auto ${paddingX} w-full pt-10 space-y-4`}>
          {" "}
          {/* 修正後: homeに合わせた配置 */}
          <RoutingButton
            buttonText="描きなおす"
            to="/draw"
            icon={FaPencilAlt}
          />
          <RoutingButton buttonText="条件変更" to="/condition" icon={FaCog} />
          {/* 保存ボタンはRoutingButtonではないのでそのまま */}
          <button
            onClick={handleSaveCourse}
            disabled={isSaving}
            // className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" // 修正前: 青背景
            className={`
                    flex items-center justify-center gap-2
                    w-full py-3 text-lg font-semibold tracking-wide
                    rounded-2xl shadow-md
                    transition-all duration-200 ease-out
                    select-none font-sans
                    ${
                      isSaving
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed" // disabledスタイル
                        : "bg-black text-white hover:brightness-105 hover:shadow-lg active:scale-[0.97]" // 通常スタイル (RoutingButtonに合わせる)
                    }
                 `} // 修正後: RoutingButtonのスタイルに近づける
          >
            <FaSave />
            <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
