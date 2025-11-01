// "use client";

// import { useEffect, useState, useCallback, useMemo } from "react"; // ★ useMemo をインポート
// import { useRouter } from "next/navigation";
// import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
// import Title from "@/components/Title";
// import RoutingButton from "@/components/RoutingButton";
// import Text from "../../components/Text";
// import {
//   FaPencilAlt,
//   FaCog,
//   FaSave,
//   FaUndo,
//   FaTimes,
//   FaPaintBrush,
// } from "react-icons/fa";
// import EditButton from "@/components/EditButton";
// import UndoButton from "@/components/UndoButton";
// import CancelButton from "@/components/CancelButton";
// import DrawButton from "@/components/DrawButton";

// const API_URL = "/api";

// type RoutePoint = {
//   lat: number;
//   lng: number;
// };

// type ResponseData = {
//   total_distance_km: number;
//   route_points: RoutePoint[];
//   drawing_points: RoutePoint[];
// };

// export default function CourseDetailPage() {
//   const [routeData, setRouteData] = useState<ResponseData | null>(null);
//   const [originalRouteData, setOriginalRouteData] =
//     useState<ResponseData | null>(null);
//   const [history, setHistory] = useState<ResponseData[]>([]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isDrawingMode, setIsDrawingMode] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const responsePointsData = localStorage.getItem("responsePointsData");

//     if (responsePointsData) {
//       try {
//         const parsedData = JSON.parse(responsePointsData);
//         const finalData: ResponseData = {
//           total_distance_km: parsedData.total_distance_km || 0,
//           route_points: parsedData.route_points || [],
//           drawing_points:
//             parsedData.drawing_points || parsedData.route_points || [],
//         };
//         setRouteData(finalData);
//         setOriginalRouteData(finalData);
//         setHistory([finalData]);
//       } catch (error) {
//         console.error("ローカルストレージのデータ解析に失敗しました:", error);
//       }
//     }
//   }, []);

//   // ★ routeData が変更されたときだけ新しいオブジェクトを生成するように useMemo でメモ化
//   const memoizedRouteData = useMemo(() => {
//     if (!routeData) return null;
//     return {
//       total_distance_km: routeData.total_distance_km,
//       route_points: routeData.route_points,
//       drawing_points: routeData.drawing_points,
//     };
//   }, [routeData]);

//   const handleSaveCourse = async () => {
//     if (!routeData || isSaving) return;
//     setIsSaving(true);
//     try {
//       const userId = localStorage.getItem("uuid");
//       if (!userId) {
//         alert("ユーザー情報が見つかりません");
//         setIsSaving(false);
//         return;
//       }
//       const response = await fetch(`${API_URL}/users/${userId}/courses`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           total_distance_km: routeData.total_distance_km,
//           route_points: routeData.route_points,
//           drawing_points: routeData.drawing_points,
//           is_favorite: false,
//         }),
//       });

//       if (response.ok) {
//         localStorage.removeItem("responsePointsData");
//         localStorage.removeItem("drawingPointsData");
//         router.push("/home");
//       } else {
//         const errorData = await response.json();
//         alert(`保存に失敗しました: ${errorData.detail || "不明なエラー"}`);
//         setIsSaving(false);
//       }
//     } catch (error) {
//       console.error("コース保存エラー:", error);
//       alert("保存中にエラーが発生しました");
//       setIsSaving(false);
//     }
//   };

//   const handleEdit = () => {
//     if (isEditing) {
//       // 編集完了
//       setOriginalRouteData(routeData);
//       setHistory([routeData!]);
//     }
//     setIsEditing(!isEditing);
//     setIsDrawingMode(false);
//   };

//   const handleUndo = useCallback(() => {
//     if (history.length > 1) {
//       const newHistory = [...history];
//       newHistory.pop();
//       setRouteData(newHistory[newHistory.length - 1]);
//       setHistory(newHistory);
//     }
//   }, [history]);

//   const handleCancelEdit = useCallback(() => {
//     setRouteData(originalRouteData);
//     setIsEditing(false);
//     setIsDrawingMode(false);
//   }, [originalRouteData]);

//   const handleToggleDrawMode = () => {
//     setIsDrawingMode(!isDrawingMode);
//   };

//   // ★ memoizedRouteData を使ってローディング判定
//   if (!memoizedRouteData) {
//     return (
//       <div className="bg-gray-50 min-h-screen">
//         <main className="max-w-md mx-auto p-4">
//           <div className="text-center py-8">
//             <Text text="データを読み込んでいます..." />
//           </div>
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <main className="max-w-md mx-auto p-4">
//         <div className="text-left mb-6 font-sans">
//           <Title title="コースが完成しました" />
//         </div>

//         <div className="px-4">
//           <MadeRouteCard_Big
//             routeData={memoizedRouteData} // ★ メモ化されたデータを渡す
//             isDrawingMode={isDrawingMode} // ★ 描画モードの状態を渡す
//           />
//         </div>

//         <div className="px-4 mt-6 space-y-4">
//           {isEditing ? (
//             <>
//               {isDrawingMode ? (
//                 <div className="flex gap-2">
//                   <DrawButton
//                     buttonText="描画完了"
//                     onClick={handleToggleDrawMode}
//                     icon={FaPaintBrush}
//                     isActive={true}
//                   />
//                 </div>
//               ) : (
//                 <>
//                   <div className="flex gap-2">
//                     <EditButton
//                       buttonText="編集完了"
//                       onClick={handleEdit}
//                       icon={FaPencilAlt}
//                     />
//                   </div>
//                   <div className="flex gap-2">
//                     <DrawButton
//                       buttonText="地図に描画"
//                       onClick={handleToggleDrawMode}
//                       icon={FaPaintBrush}
//                     />
//                   </div>
//                   <div className="flex gap-2">
//                     <UndoButton
//                       buttonText="元に戻す"
//                       onClick={handleUndo}
//                       icon={FaUndo}
//                       disabled={history.length <= 1}
//                     />
//                     <CancelButton
//                       buttonText="編集を破棄"
//                       onClick={handleCancelEdit}
//                       icon={FaTimes}
//                     />
//                   </div>
//                 </>
//               )}
//             </>
//           ) : (
//             <>
//               <div className="flex gap-2">
//                 <RoutingButton
//                   buttonText="条件変更"
//                   to="/condition"
//                   icon={FaCog}
//                 />
//                 <RoutingButton
//                   buttonText="描きなおす"
//                   to="/draw"
//                   icon={FaPencilAlt}
//                 />
//               </div>
//               <div className="flex gap-2">
//                 <EditButton
//                   buttonText="ルート編集"
//                   onClick={handleEdit}
//                   icon={FaPencilAlt}
//                 />
//               </div>
//               <button
//                 onClick={handleSaveCourse}
//                 disabled={isSaving}
//                 className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 text-lg font-semibold tracking-wide rounded-2xl shadow-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-out select-none font-sans"
//               >
//                 <FaSave size={22} />
//                 <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
//               </button>
//             </>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import Text from "../../components/Text";
import {
  FaPencilAlt,
  FaCog,
  FaSave,
  FaUndo,
  FaTimes,
  FaPaintBrush,
} from "react-icons/fa";
import EditButton from "@/components/EditButton";
import UndoButton from "@/components/UndoButton";
import CancelButton from "@/components/CancelButton";
import DrawButton from "@/components/DrawButton";

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
  const [originalRouteData, setOriginalRouteData] =
    useState<ResponseData | null>(null);
  const [history, setHistory] = useState<ResponseData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const responsePointsData = localStorage.getItem("responsePointsData");

    if (responsePointsData) {
      try {
        const parsedData = JSON.parse(responsePointsData);
        const finalData: ResponseData = {
          total_distance_km: parsedData.total_distance_km || 0,
          route_points: parsedData.route_points || [],
          drawing_points:
            parsedData.drawing_points || parsedData.route_points || [],
        };
        setRouteData(finalData);
        setOriginalRouteData(finalData);
        setHistory([finalData]);
      } catch (error) {
        console.error("ローカルストレージのデータ解析に失敗しました:", error);
      }
    }
  }, []);

  const memoizedRouteData = useMemo(() => {
    if (!routeData) return null;
    return {
      total_distance_km: routeData.total_distance_km,
      route_points: routeData.route_points,
      drawing_points: routeData.drawing_points,
    };
  }, [routeData]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_distance_km: routeData.total_distance_km,
          route_points: routeData.route_points,
          drawing_points: routeData.drawing_points,
          is_favorite: false,
        }),
      });

      if (response.ok) {
        localStorage.removeItem("responsePointsData");
        localStorage.removeItem("drawingPointsData");
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

  const handleEdit = () => {
    if (isEditing) {
      // 編集完了
      setOriginalRouteData(routeData);
      setHistory([routeData!]);
    }
    setIsEditing(!isEditing);
    setIsDrawingMode(false);
  };

  const handleUndo = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setRouteData(newHistory[newHistory.length - 1]);
      setHistory(newHistory);
    }
  }, [history]);

  const handleCancelEdit = useCallback(() => {
    setRouteData(originalRouteData);
    setIsEditing(false);
    setIsDrawingMode(false);
  }, [originalRouteData]);

  const handleToggleDrawMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  if (!memoizedRouteData) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-md mx-auto p-4">
          <div className="text-center py-8">
            <Text text="データを読み込んでいます..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-md mx-auto p-4">
        <div className="text-left mb-6 font-sans">
          <Title title="コースが完成しました" />
        </div>

        <div className="px-4">
          <MadeRouteCard_Big
            routeData={memoizedRouteData}
            isDrawingMode={isDrawingMode}
          />
        </div>

        <div className="px-4 mt-6 space-y-4">
          {isEditing ? (
            <>
              {isDrawingMode ? (
                <div className="flex gap-2">
                  <DrawButton
                    buttonText="描画完了"
                    onClick={handleToggleDrawMode}
                    icon={FaPaintBrush}
                    isActive={true}
                  />
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <EditButton
                      buttonText="編集完了"
                      onClick={handleEdit}
                      icon={FaPencilAlt}
                    />
                  </div>
                  <div className="flex gap-2">
                    <DrawButton
                      buttonText="地図に描画"
                      onClick={handleToggleDrawMode}
                      icon={FaPaintBrush}
                    />
                  </div>
                  <div className="flex gap-2">
                    <UndoButton
                      buttonText="元に戻す"
                      onClick={handleUndo}
                      icon={FaUndo}
                      disabled={history.length <= 1}
                    />
                    <CancelButton
                      buttonText="編集を破棄"
                      onClick={handleCancelEdit}
                      icon={FaTimes}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <RoutingButton
                  buttonText="条件変更"
                  to="/condition"
                  icon={FaCog}
                />
                <RoutingButton
                  buttonText="描きなおす"
                  to="/draw"
                  icon={FaPencilAlt}
                />
              </div>
              <div className="flex gap-2">
                <EditButton
                  buttonText="ルート編集"
                  onClick={handleEdit}
                  icon={FaPencilAlt}
                />
              </div>
              <button
                onClick={handleSaveCourse}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 text-lg font-semibold tracking-wide rounded-2xl shadow-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-out select-none font-sans"
              >
                <FaSave size={22} />
                <span>{isSaving ? "保存中..." : "保存してホームに戻る"}</span>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}