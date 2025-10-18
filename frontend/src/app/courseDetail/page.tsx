"use client";

import BackButton from "@/components/BackButton";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title"; // Title コンポーネントをインポート
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CourseDetailContent() {
    const searchParams = useSearchParams();

    const id = searchParams.get("id");
    const positionsStr = searchParams.get("positions");
    const course_distance = searchParams.get("course_distance");
    const start_distance = searchParams.get("start_distance");
    const created_at = searchParams.get("created_at");
    const isFavorite = searchParams.get("isFavorite") === "true";

    const positions = positionsStr ? JSON.parse(positionsStr) : [];

    const routePositionsTokyo: [number, number][] = [
        [35.6895, 139.6917], // 新宿
        [35.6812, 139.7671], // 東京駅
        [35.6586, 139.7454], // 東京タワー
    ];
    const courseDistance = 10; // 仮のコース距離

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="max-w-md mx-auto p-4">
                <div className="text-left mb-6"> {/* 左寄せのコンテナに変更 */}
                    <Title title="コース詳細" /> {/* Title コンポーネントを使用 */}
                    <div className="mt-2"> {/* 戻るボタンをTitleの下に配置 */}
                        <BackButton text="戻る" />
                    </div>
                </div>

                <div className="px-4"> {/* 左右に16pxの余白を追加 */}
                    <MadeRouteCard_Big
                        positions={positions.length > 0 ? positions : routePositionsTokyo}
                        course_distance={course_distance ?? courseDistance}
                    />
                </div>
            </main>
        </div>
    );
}

export default function CourseDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CourseDetailContent />
        </Suspense>
    );
}
