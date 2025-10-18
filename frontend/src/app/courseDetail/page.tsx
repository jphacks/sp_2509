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
    const drawingPointsStr = searchParams.get("drawing_points");

    const positions = positionsStr ? JSON.parse(positionsStr) : [];
    const drawingPoints = drawingPointsStr ? JSON.parse(drawingPointsStr) : positions;


    const routeData = {
        total_distance_km: course_distance ? parseFloat(course_distance) : 0,
        route_points: positions.map((p: [number, number]) => ({ lat: p[0], lng: p[1] })),
        drawing_points: drawingPoints.map((p: [number, number]) => ({ lat: p[0], lng: p[1] })),
    };


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
                        routeData={routeData}
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
