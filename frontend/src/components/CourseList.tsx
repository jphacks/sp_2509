// frontend/src/components/CourseList.tsx
"use client";

import { useState, useMemo } from "react";
import MadeRoute from "./MadeRoute";
import type { LatLngExpression } from "leaflet";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // ページネーション用アイコン

// --- 定義 ---
type Course = {
  id: string;
  total_distance_km: number;
  distance_to_start_km: number;
  created_at: string;
  is_favorite: boolean;
  route_points: { lat: number; lng: number }[];
};

type CourseListProps = {
  courses: Course[];
  onDelete: (id: string) => void;
  onToggleFavorite: (newValue: boolean, id: string) => void;
};

const INITIAL_VISIBLE_COUNT = 3; // 初期表示件数
const ITEMS_PER_PAGE = 5; // 展開後の1ページあたりの件数

// --- ページネーションUIコンポーネント ---
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const pageNumbers: (number | string)[] = [];

  // 表示するページ番号のロジック (例: < 1 ... 4 5 6 ... 10 >)
  const MAX_VISIBLE_PAGES = 3; // 現在ページの前後
  const showEllipsisStart = currentPage > MAX_VISIBLE_PAGES;
  const showEllipsisEnd = currentPage < totalPages - (MAX_VISIBLE_PAGES - 1);

  // 1ページ目
  pageNumbers.push(1);

  // 開始側の ...
  if (showEllipsisStart) {
    pageNumbers.push("...");
  }

  // 中間のページ
  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= MAX_VISIBLE_PAGES) {
    start = 2;
    end = Math.min(totalPages - 1, MAX_VISIBLE_PAGES);
  }
  if (currentPage > totalPages - MAX_VISIBLE_PAGES) {
    start = Math.max(2, totalPages - MAX_VISIBLE_PAGES + 1);
    end = totalPages - 1;
  }

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  // 終了側の ...
  if (showEllipsisEnd) {
    pageNumbers.push("...");
  }

  // 最後のページ (1ページしかない場合は追加しない)
  if (totalPages > 1) {
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-gray-100"
        aria-label="Previous Page"
      >
        <FaChevronLeft size={12} />
      </button>

      {pageNumbers.map((num, index) =>
        typeof num === "number" ? (
          <button
            key={index}
            onClick={() => onPageChange(num)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              currentPage === num
                ? "bg-black text-white"
                : "bg-gray-100 text-black hover:bg-gray-200"
            }`}
          >
            {num}
          </button>
        ) : (
          <span key={index} className="px-2 py-2 text-sm text-gray-400">
            {num}
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md disabled:opacity-50 enabled:hover:bg-gray-100"
        aria-label="Next Page"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

// --- CourseList メインコンポーネント ---
const CourseList = ({
  courses,
  onDelete,
  onToggleFavorite,
}: CourseListProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(courses.length / ITEMS_PER_PAGE);

  // 表示するコースを計算
  const coursesToShow = useMemo(() => {
    // 展開後: ページネーション
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return courses.slice(startIndex, endIndex);
  }, [currentPage, courses]);

  // ページ変更時
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* --- コースアイテム --- */}
      {coursesToShow.map((course) => {
        const positions: LatLngExpression[] = course.route_points.map((p) => [
          p.lat,
          p.lng,
        ] as [number, number]);
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


      {/* 展開後: ページネーション */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default CourseList;