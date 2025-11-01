"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

const NavigationMap = dynamic(() => import('@/components/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center">
        <div className="w-8 h-8 bg-white rounded-full animate-pulse mb-4 mx-auto"></div>
        <p>マップを読み込んでいます...</p>
      </div>
    </div>
  ),
});

type Point = { lat: number; lng: number };

type RouteData = {
  id: string;
  total_distance_km: number;
  route_points: Point[];
  start_distance: number;
  created_at: string;
  isFavorite: boolean;
};

// RDPアルゴリズムによる経路単純化
function getPerpendicularDistance(point: Point, lineStart: Point, lineEnd: Point) {
  const { lat: x, lng: y } = point;
  const { lat: x1, lng: y1 } = lineStart;
  const { lat: x2, lng: y2 } = lineEnd;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) { // 0除算を避ける
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function rdp(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) {
    return points;
  }

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = getPerpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  let results: Point[] = [];

  if (dmax > epsilon) {
    const recResults1 = rdp(points.slice(0, index + 1), epsilon);
    const recResults2 = rdp(points.slice(index, points.length), epsilon);

    results = recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    results = [points[0], points[points.length - 1]];
  }

  return results;
}

// --- ナビゲーションロジック ---
type TurnType = 'left' | 'right' | 'u-turn' | 'straight';
export type TurnPoint = {
  lat: number;
  lng: number;
  turn: TurnType;
};

// 角度の閾値
const TURN_THRESHOLDS = {
  U_TURN: 150,
  TURN: 30,
};

// 2点間の方位角を計算する関数
function getBearing(start: Point, end: Point): number {
  const toRadians = (deg: number) => deg * Math.PI / 180;
  const toDegrees = (rad: number) => rad * 180 / Math.PI;

  const lat1 = toRadians(start.lat);
  const lon1 = toRadians(start.lng);
  const lat2 = toRadians(end.lat);
  const lon2 = toRadians(end.lng);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// ターンを抽出する関数
function extractTurns(points: Point[]): TurnPoint[] {
  if (points.length === 0) {
    return [];
  }

  const turns: TurnPoint[] = [];

  // スタート地点を追加
  turns.push({ ...points[0], turn: 'straight' }); // 'start' の代わりに 'straight' を使う

  if (points.length >= 3) {
    for (let i = 1; i < points.length - 1; i++) {
      const p_current = points[i - 1];
      const p_next = points[i];
      const p_future = points[i + 1];

      const bearing1 = getBearing(p_current, p_next);
      const bearing2 = getBearing(p_next, p_future);

      let angleDiff = bearing2 - bearing1;

      // 角度を-180度から180度の範囲に正規化
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      let turnType: TurnType = 'straight';
      if (Math.abs(angleDiff) > TURN_THRESHOLDS.U_TURN) {
        turnType = 'u-turn';
      } else if (angleDiff > TURN_THRESHOLDS.TURN) {
        turnType = 'right';
      } else if (angleDiff < -TURN_THRESHOLDS.TURN) {
        turnType = 'left';
      }

      if (turnType !== 'straight') {
        turns.push({ ...p_next, turn: turnType });
      }
    }
  }

  // ゴール地点を追加
  if (points.length > 1) {
    turns.push({ ...points[points.length - 1], turn: 'straight' }); // 'goal' の代わりに 'straight' を使う
  }


  return turns;
}


function NavigationContent() {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [simplifiedRoute, setSimplifiedRoute] = useState<Point[]>([]);
  const [turnPoints, setTurnPoints] = useState<TurnPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // SessionStorageからナビゲーションデータを取得
    const storedData = sessionStorage.getItem('navigationData');

    if (storedData) {
      try {
        const parsedData: RouteData = JSON.parse(storedData);
        setRouteData(parsedData);
        if (parsedData.route_points) {
          // 経路を単純化する
          // epsilon値は経路の細かさに応じて調整が必要。現状は都市部の徒歩経路を想定して0.00025としています。
          const EPSILON = 0.00025;
          const simplified = rdp(parsedData.route_points, EPSILON);
          setSimplifiedRoute(simplified);
          // ターンを抽出する
          const turns = extractTurns(simplified);
          setTurnPoints(turns);
        }
      } catch (error) {
        console.error('ナビゲーションデータの解析に失敗しました:', error);
        // エラーの場合はホームページにリダイレクト
        window.location.href = '/home';
      }
    } else {
      // データがない場合はホームページにリダイレクト
      console.warn('ナビゲーションデータが見つかりません');
      window.location.href = '/home';
    }

    setIsLoading(false);
  }, []);

  if (isLoading || !routeData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 bg-white rounded-full animate-pulse mb-4 mx-auto"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationMap
      routeData={routeData}
      simplifiedRoute={simplifiedRoute}
      turnPoints={turnPoints}
    />
  );
}

export default function NavigationPage() {
  return <NavigationContent />;
}
