"use client";

import BackButton from "@/components/BackButton";
import MadeRouteCard_Big from "@/components/MadeRouteCard_Big";
import Title from "@/components/Title";
import RoutingButton from "@/components/RoutingButton";
import { useEffect, useState } from "react";
import { FaRunning } from "react-icons/fa";

type CourseData = {
    id: string;
    positions: [number, number][];
    course_distance: number;
    start_distance: number;
    created_at: string;
    isFavorite: boolean;
};

function CourseDetailContent() {
    const [courseData, setCourseData] = useState<CourseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // SessionStorageからコース詳細データを取得
        const storedData = sessionStorage.getItem('courseDetailData');

        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setCourseData(parsedData);
            } catch (error) {
                console.error('コース詳細データの解析に失敗しました:', error);
                window.location.href = '/home';
            }
        } else {
            console.warn('コース詳細データが見つかりません');
            window.location.href = '/home';
        }

        setIsLoading(false);
    }, []);

    if (isLoading || !courseData) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 bg-black rounded-full animate-pulse mb-4 mx-auto"></div>
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    const routeData = {
        total_distance_km: courseData.course_distance,
        route_points: courseData.positions.map((p: [number, number]) => ({ lat: p[0], lng: p[1] })),
        drawing_points: courseData.positions.map((p: [number, number]) => ({ lat: p[0], lng: p[1] })),
    };


    const handleStartNavigation = () => {
        // SessionStorageにナビゲーションデータを保存
        const navigationData = {
            id: courseData.id,
            route_points: courseData.positions.map((p: [number, number]) => ({ lat: p[0], lng: p[1] })),
            total_distance_km: courseData.course_distance,
            start_distance: courseData.start_distance,
            created_at: courseData.created_at,
            isFavorite: courseData.isFavorite,
        };

        sessionStorage.setItem('navigationData', JSON.stringify(navigationData));

        // ナビゲーションページに遷移
        window.location.href = '/navigation';
    }; return (
        <div className="bg-gray-50 max-w-md mx-auto min-h-screen pb-20 relative">
            <main className="p-4">
                <div className="text-left mb-6"> {/* 左寄せのコンテナに変更 */}
                    <Title title="コース詳細" /> {/* Title コンポーネントを使用 */}
                    <div className="mt-2"> {/* 戻るボタンをTitleの下に配置 */}
                        <BackButton text="戻る" />
                    </div>
                </div>

                <MadeRouteCard_Big
                    routeData={routeData}
                />
            </main>

            <div className="fixed bottom-4 left-0 right-0 px-4">
                <div className="max-w-md mx-auto">
                    <RoutingButton
                        buttonText="ランニングを開始"
                        icon={FaRunning}
                        onClick={handleStartNavigation}
                    />
                </div>
            </div>
        </div>
    );
}

export default function CourseDetailPage() {
    return <CourseDetailContent />;
}
