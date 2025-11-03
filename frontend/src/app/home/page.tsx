// frontend/src/app/home/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Carousel from "../../components/Carousel";
import Title from "../../components/Title";
import Text from "../../components/Text";
import RoutingButton from "../../components/RoutingButton";
import EmptyCourse from "../../components/EmptyCourse";
import CourseList from "../../components/CourseList";
import Loading from "../../components/Loading";
import Image from "next/image"; // Image コンポーネントをインポート
import Header from "@/components/Header";
import { FaPencilAlt } from "react-icons/fa";

const API_URL = "/api";

// ★★★ テストモード切り替え ★★★
// テストデータを使用する場合は true に、APIから取得する場合は false にしてください。
const isTestMode = false;

type Course = {
  id: string;
  total_distance_km: number;
  distance_to_start_km: number;
  created_at: string;
  is_favorite: boolean;
  route_points: { lat: number; lng: number }[];
};

// --- テストデータ ---
const routePositionsTokyo: [number, number][] = [
  [35.6895, 139.6917], // 新宿
  [35.6812, 139.7671], // 東京駅
  [35.6586, 139.7454], // 東京タワー
];
const routePositionsOsaka: [number, number][] = [
  [34.702485, 135.495951], // 大阪駅
  [34.6525, 135.5063], // 通天閣
  [34.6937, 135.1955], // 神戸
];
const routePositionsHokkaido: [number, number][] = [
  [43.0621, 141.3544], // 札幌
  [41.7687, 140.7288], // 函館
  [43.7707, 142.365], // 旭川
];
const testCourses: Course[] = [
  {
    id: "test-1",
    total_distance_km: 10.5,
    distance_to_start_km: 0.3,
    created_at: "2025-10-20T00:00:00Z",
    is_favorite: true,
    route_points: routePositionsTokyo.map(([lat, lng]) => ({ lat, lng })),
  },
  {
    id: "test-2",
    total_distance_km: 8.2,
    distance_to_start_km: 1.5,
    created_at: "2025-10-19T00:00:00Z",
    is_favorite: false,
    route_points: routePositionsOsaka.map(([lat, lng]) => ({ lat, lng })),
  },
  {
    id: "test-3",
    total_distance_km: 15.0,
    distance_to_start_km: 5.0,
    created_at: "2025-10-18T00:00:00Z",
    is_favorite: true,
    route_points: routePositionsHokkaido.map(([lat, lng]) => ({ lat, lng })),
  },
];
// --- テストデータここまで ---

export default function Home() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(!isTestMode); // テストモード時はローディング不要
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const initializeUser = useCallback(async (forceNew: boolean = false) => {
    try {
      let userId = localStorage.getItem("uuid");
      if (!userId || forceNew) {
        if (forceNew) {
          localStorage.removeItem("uuid");
        }
        const res = await fetch(`${API_URL}/users`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to create a new user.");
        const data = await res.json();
        userId = data.user_id;
        if (userId) {
          localStorage.setItem("uuid", userId);
        }
      }
      setUuid(userId);
    } catch (err) {
      console.error("Error initializing user:", err);
      setError("ユーザー情報の初期化に失敗しました。");
      setLoading(false);
    }
  }, []);

  // 1. UUIDの初期化
  useEffect(() => {
    if (isTestMode) return;
    initializeUser();
  }, [initializeUser]);

  // 2. 現在地の取得
  useEffect(() => {
    if (isTestMode) {
      setLoading(false);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (e) => {
          console.error("Failed to get current location:", e);
          setError("現在地の取得に失敗しました。");
          setLoading(false);
        },
        {
          timeout: 10000, // 10秒でタイムアウト
        }
      );
    } else {
      setError("お使いのブラウザはGeolocationに対応していません。");
      setLoading(false);
    }
  }, []);

  // 3. コース情報の取得
  useEffect(() => {
    if (isTestMode || !uuid || !currentLocation) return;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      const sortBy = `${sortField}_${sortOrder}`;
      try {
        const res = await fetch(
          `${API_URL}/users/${uuid}/courses?current_lat=${currentLocation.lat}&current_lng=${currentLocation.lng}&sort_by=${sortBy}&favorites_only=${showFavoritesOnly}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            // DBからuserが消えたなどの理由で404が返ってきた場合、UUIDを再生成して再取得を試みる
            console.log("User not found (404). Re-initializing user UUID.");
            setLoading(false); // ローディングを止める
            await initializeUser(true);
            return; // 再初期化後、useEffectが再実行されるのを待つ
          }
          throw new Error("コースの取得に失敗しました。");
        }
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました。"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [
    uuid,
    currentLocation,
    sortField,
    sortOrder,
    showFavoritesOnly,
    initializeUser,
  ]);

  // 表示するコースリストを決定
  const displayCourses = isTestMode ? testCourses : courses;

  const handleDelete = async (id: string) => {
    if (isTestMode || !uuid) return;

    try {
      const res = await fetch(`${API_URL}/users/${uuid}/courses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("コースの削除に失敗しました。");
      }

      // API成功後にUIを更新
      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました。"
      );
    }
  };

  const handleToggleFavorite = async (newValue: boolean, id: string) => {
    if (isTestMode || !uuid) return;

    // UIを即時反映
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id ? { ...course, is_favorite: newValue } : course
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/users/${uuid}/courses/${id}/toggle_favorite`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("お気に入りの更新に失敗しました。");
      }

      const data = await res.json();

      // APIからのレスポンスで再度状態を同期
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id
            ? { ...course, is_favorite: data.is_favorite }
            : course
        )
      );
    } catch (err) {
      // エラーが発生した場合、UIを元に戻す
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id ? { ...course, is_favorite: !newValue } : course
        )
      );
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました。"
      );
    }
  };

  const carouselItems = [
    {
      src: "/images/pic1.png",
      alt: "Slide 1",
      description: "走りたいコースの形を書く",
    },
    {
      src: "/images/sample2.png",
      alt: "Slide 2",
      description: "走り始める場所とおおよその長さを決める",
    },
    {
      src: "/images/sample3.png",
      alt: "Slide 3",
      description: "AshiArtがコースを生成",
    },
    { src: "/images/sample4.png", alt: "Slide 4", description: "走る！" },
  ];

  const paddingX = "px-4";
  const paddingTop = "pt-8";
  const paddingBottom = "pb-12";

  const renderCourses = () => {
    if (loading) return <Loading loadingText="コースを読み込み中..." />;
    if (error) return <Text text={error} />;
    if (displayCourses.length === 0) return <EmptyCourse />;
    return (
      <CourseList
        courses={displayCourses}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  };

  return (
    <div className="text-black min-h-screen">
      <main
        className={`flex flex-col ${paddingTop} ${paddingBottom} max-w-md mx-auto min-h-screen`}
      >
        <div className={`${paddingX} flex flex-col`}>
          {/* Top Text */}
          {/* ↓↓↓ 変更箇所: flexコンテナでアイコンとタイトルを囲む ↓↓↓ */}
          <div className="flex items-center my-2">
            <Image
              src="/Title.png"
              alt="AshiArt icon"
              width={280}
              height={280}
            />{" "}
            {/* アイコンを追加 */}
            {/* <div className="text-left">
              <Title title="AshiArt" />
            </div> */}
          </div>

          <Text text="好きな絵のコースで走ってみませんか？" />
          <Text text="GPSアートになるジョギングコースをデザインしましょう" />

          {/* How to Use Section */}
          <div className="my-4">
            <Header headerText="使い方" />
            <div className="my-4 -mx-4 mb-4">
              <Carousel
                items={carouselItems}
                imageBorderRadius="rounded-2xl"
                textClassName="text-white"
              />
            </div>
          </div>

          {/* Created Course Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <Header headerText="作成したコース" />
            </div>
            {!isTestMode && (
              <div className="flex gap-4">
                <select
                  value={sortField} // ★ 変更
                  onChange={(e) => {
                    setSortField(e.target.value); // ★ 変更
                  }}
                  className="p-2 rounded-[8px] font-semibold text-sm min-w-[90px]"
                >
                  <option value="created_at">作成日</option>
                  <option value="distance">現在地からの距離</option>
                  <option value="total_distance">コース全長</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="p-2 rounded-[8px] font-semibold text-sm min-w-[70px] hover:bg-gray-200"
                >
                  {sortOrder === "asc" ? "▲ 昇順" : "▼ 降順"}
                </button>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="flex items-center gap-1 p-2 rounded-[8px] font-semibold text-sm min-w-[90px] hover:bg-gray-200 text-black"
                >
                  <span className={showFavoritesOnly ? "text-amber-500" : ""}>
                    {showFavoritesOnly ? "★" : "☆"}
                  </span>
                  <span>{showFavoritesOnly ? "お気に入り" : "全て"}</span>
                </button>
              </div>
            )}
          </div>
          {renderCourses()}
        </div>

        <div className="fixed bottom-4 left-0 right-0">
          <div className="max-w-md mx-auto px-4">
            <RoutingButton
              buttonText="コースを作成する"
              onClick={() => router.push('/start')}
              icon={FaPencilAlt}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
