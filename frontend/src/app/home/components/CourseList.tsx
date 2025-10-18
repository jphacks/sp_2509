"use client";

import MadeRoute from "../../../components/MadeRoute";
import type { LatLngExpression } from "leaflet";

// page.tsx から渡される course オブジェクトの型
type Course = {
    id: string;
    total_distance_km: number;
    distance_to_start_km: number;
    created_at: string;
    is_favorite: boolean;
    route_points: { lat: number; lng: number }[];
};

// CourseList コンポーネントが受け取る props の型
type CourseListProps = {
    courses: Course[];
    onDelete: (id: string) => void;
    onToggleFavorite: (newValue: boolean, id: string) => void;
};

const CourseList = ({ courses, onDelete, onToggleFavorite }: CourseListProps) => {
    return (
        <div>
            {courses.map(course => {
                const positions: LatLngExpression[] = course.route_points.map(p => [p.lat, p.lng] as [number, number]);
                return (
                    <MadeRoute
                        key={course.id}
                        id={course.id}
                        positions={positions}
                        course_distance={course.total_distance_km}
                        start_distance={course.distance_to_start_km}
                        created_at={course.created_at}
                        isFavorite={course.is_favorite}
                        onDelete={onDelete}
                        onToggleFavorite={onToggleFavorite}
                    />
                );
            })}
        </div>
    );
};

export default CourseList;
