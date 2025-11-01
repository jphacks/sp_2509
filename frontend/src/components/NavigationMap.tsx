"use client";

import React, { useState, useMemo, useEffect } from "react";
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import { HiMoon } from "react-icons/hi";
import { MdOutlineTurnLeft, MdOutlineTurnRight, MdOutlineUTurnRight, MdGpsFixed, MdGpsNotFixed } from "react-icons/md";
import { FaCompass, FaRunning } from "react-icons/fa";
import { useRouter } from "next/navigation";
import RoutingButton from "./RoutingButton";
import { useLocation } from "../hooks/useLocation";
import { useHeading } from "../hooks/useHeading";
import { startIcon, goalIcon } from "./MapIcons";
import EnergySaveMode from "./EnergySaveMode";
import { useMapEvents } from "react-leaflet";
import { GradientPolyline, LocationTracker } from "./MapComponents";
import { TurnPoint } from "../app/navigation/page"; // page.tsxから型をインポート

// 音声合成の関数
const speak = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // 以前の発話をキャンセル
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Web Speech API is not supported in this browser.");
  }
};

// Haversine formula for distance calculation
function getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371e3; // metres
  const toRad = (deg: number) => deg * Math.PI / 180;

  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);
  const deltaLat = toRad(p2.lat - p1.lat);
  const deltaLon = toRad(p2.lng - p1.lng);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// --- Custom Hook for Navigation Logic ---
const useNavigation = (turnPoints: TurnPoint[], currentPosition: { lat: number; lng: number } | null) => {
  const { useState, useEffect, useRef } = React;
  const [nextTurnIndex, setNextTurnIndex] = useState(0);
  const [upcomingTurnsWithDistances, setUpcomingTurnsWithDistances] = useState<Array<TurnPoint & { distance: number | null }>>([]);
  const [isApproaching, setIsApproaching] = useState(false); //ターンポイント30m以内に入ったかどうか

  // オフコース検知用の状態
  const minDistanceRef = useRef(Infinity);
  const offRouteAlertedRef = useRef(false);

  // ターゲットとなる交差点が変わったら、オフコース検知の状態をリセット
  useEffect(() => {
    minDistanceRef.current = Infinity;
    offRouteAlertedRef.current = false;
  }, [nextTurnIndex]);


  useEffect(() => {
    if (!currentPosition || turnPoints.length === 0 || nextTurnIndex >= turnPoints.length) {
      setUpcomingTurnsWithDistances(turnPoints.slice(nextTurnIndex, nextTurnIndex + 3).map(turn => ({ ...turn, distance: null })));
      return;
    }

    const nextTurnPoint = turnPoints[nextTurnIndex];
    const distanceToFirst = getDistance(currentPosition, nextTurnPoint);

    // --- オフコース検知 ---
    if (distanceToFirst < minDistanceRef.current) {
      minDistanceRef.current = distanceToFirst;
    } else {
      if (!offRouteAlertedRef.current && distanceToFirst > minDistanceRef.current + 50) { // 最短から50m以上離れたら警告
        speak('コースから外れている可能性があります');
        offRouteAlertedRef.current = true; // 同じ逸脱で何度も警告しないようにする
      }
    }
    // --- オフコース検知ここまで ---

    const approachingThreshold = 30; // 30m以内
    const isCurrentlyApproaching = distanceToFirst < approachingThreshold;

    if (isCurrentlyApproaching) {
      if (!isApproaching) {
        let speechText = '';
        const currentTurn = nextTurnPoint.turn;

        if (currentTurn === 'left') speechText = '左です。';
        else if (currentTurn === 'right') speechText = '右です。';
        else if (currentTurn === 'u-turn') speechText = '折り返しです。';

        // 次の次のターンの情報を取得
        const nextNextTurnIndex = nextTurnIndex + 1;
        if (nextNextTurnIndex < turnPoints.length) {
          const nextNextTurnPoint = turnPoints[nextNextTurnIndex];
          const distanceToNextNext = getDistance(nextTurnPoint, nextNextTurnPoint);
          const roundedDistance = Math.round(distanceToNextNext / 10) * 10;

          const nextTurnDirection = nextNextTurnPoint.turn;
          let nextTurnText = '';
          if (nextTurnDirection === 'left') nextTurnText = '左です。';
          else if (nextTurnDirection === 'right') nextTurnText = '右です。';
          else if (nextTurnDirection === 'u-turn') nextTurnText = '折り返しです。';
          else if (nextTurnDirection === 'straight') nextTurnText = '直進です。';

          if (roundedDistance > 0 && nextTurnText) {
            speechText += `その先、およそ${roundedDistance}メートルで、${nextTurnText}`;
          }
        }

        if (speechText) {
          speak(speechText);
        }
        setIsApproaching(true);
      }
    } else {
      if (isApproaching) {
        setNextTurnIndex(nextTurnIndex + 1);
        setIsApproaching(false);
        return; // Indexが更新されるので、次のレンダリングで再計算
      }
    }

    const turns = turnPoints.slice(nextTurnIndex, nextTurnIndex + 3);
    let cumulativeDistance = distanceToFirst;
    const turnsWithDistances = turns.map((turn, index) => {
      if (index === 0) {
        return { ...turn, distance: distanceToFirst };
      }
      if (index > 0) {
        const prevTurn = turns[index - 1];
        cumulativeDistance += getDistance(prevTurn, turn);
        return { ...turn, distance: cumulativeDistance };
      }
      return { ...turn, distance: null }; // Should not happen
    });

    setUpcomingTurnsWithDistances(turnsWithDistances);

  }, [currentPosition, turnPoints, nextTurnIndex, isApproaching]);

  return { upcomingTurns: upcomingTurnsWithDistances };
};


type Point = { lat: number; lng: number };

type RouteData = {
  id: string;
  total_distance_km: number;
  route_points: Point[];
  start_distance: number;
  created_at: string;
  isFavorite: boolean;
};

type NavigationMapProps = {
  routeData: RouteData;
  simplifiedRoute: Point[];
  turnPoints: TurnPoint[];
};

import { IconType } from "react-icons";

const turnColors = [
  { color: '#FBBF24', borderColor: '#F59E0B' }, // amber-400, amber-500
  { color: '#F97316', borderColor: '#EA580C' }, // orange-500, orange-600
  { color: '#EF4444', borderColor: '#DC2626' }, // red-500, red-600
];

// スタート文字アイコン
const StartCharacter = ({ size, className }: { size?: number; className?: string }) => (
  <span className={`font-bold text-xl text-green-500 ${className || ''}`}>S</span>
);

// ゴール文字アイコン
const GoalCharacter = ({ size, className }: { size?: number; className?: string }) => (
  <span className={`font-bold text-xl text-black ${className || ''}`}>G</span>
);

const turnIcons: { [key in 'left' | 'right' | 'u-turn']: IconType } = {
  left: MdOutlineTurnLeft,
  right: MdOutlineTurnRight,
  'u-turn': MdOutlineUTurnRight,
};

function MapEvents({ setIsFollowing }: { setIsFollowing: (isFollowing: boolean) => void }) {
  useMapEvents({
    dragstart: () => {
      setIsFollowing(false);
    },
  });
  return null;
}

// コンパス付き現在地アイコンを生成する関数
const createCurrentLocationIcon = (heading: number | null) => {
  const rotation = heading ?? 0;
  return L.divIcon({
    html: `
      <div style="
          transform: rotate(${rotation}deg);
          width: 32px;
          height: 32px;
          transition: transform 0.3s ease-out;
      ">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 -8 L10 14 L22 14 Z" fill="#3b82f6" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="10" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};


export default function NavigationMap({ routeData, simplifiedRoute, turnPoints }: NavigationMapProps) {
  const router = useRouter();
  const currentPositionArray = useLocation();
  const { heading } = useHeading();

  // 初期音声案内のためのuseEffect
  useEffect(() => {
    speak("スタート地点に向かってください");
  }, []); // 空の依存配列で、マウント時に一度だけ実行

  const currentPosition = useMemo(() =>
    currentPositionArray ? { lat: currentPositionArray[0], lng: currentPositionArray[1] } : null,
    [currentPositionArray]
  );
  const { upcomingTurns } = useNavigation(turnPoints, currentPosition);
  const [energySaveMode, setEnergySaveMode] = useState(false);
  const [showSimplifiedRoute, setShowSimplifiedRoute] = useState(false); // デバッグ用フラグ
  const [isFollowing, setIsFollowing] = useState(true);

  const currentLocationIcon = createCurrentLocationIcon(heading);

  const routePositions: [number, number][] = routeData.route_points.map(p => [p.lat, p.lng]);
  const simplifiedRoutePositions: [number, number][] = simplifiedRoute.map(p => [p.lat, p.lng]);

  const initialCenter: [number, number] = currentPosition ? [currentPosition.lat, currentPosition.lng] :
    (routePositions.length > 0 ? routePositions[0] : [43.0621, 141.3544]);

  const handleBack = () => {
    router.back();
  };

  const toggleEnergySaveMode = () => {
    setEnergySaveMode(!energySaveMode);
  };

  const toggleShowSimplifiedRoute = () => {
    setShowSimplifiedRoute(!showSimplifiedRoute);
  };

  const toggleFollowing = () => {
    setIsFollowing(!isFollowing);
  };

  if (energySaveMode) {
    return (
      <EnergySaveMode
        total_distance_km={routeData.total_distance_km}
        toggleEnergySaveMode={toggleEnergySaveMode}
        upcomingTurn={upcomingTurns[0]}
      />
    );
  }

  return (
    <div className="w-full h-screen relative">
      <MapContainer
        center={initialCenter}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapEvents setIsFollowing={setIsFollowing} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {routePositions.length > 1 && !showSimplifiedRoute && (
          <GradientPolyline positions={routePositions} />
        )}

        {showSimplifiedRoute && turnPoints.map((turn, index) => {
          if (turn.turn === 'straight') return null;
          const IconComponent = turnIcons[turn.turn];
          const iconHtml = ReactDOMServer.renderToString(
            <div className="p-1 bg-white rounded shadow-lg">
              <IconComponent size={24} className="text-blue-600" />
            </div>
          );
          return (
            <Marker key={`turn-${index}`} position={[turn.lat, turn.lng]} icon={L.divIcon({
              html: iconHtml,
              className: '', // important to clear default styles
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })} />
          )
        })}
        {routePositions.length > 1 && (
          <Marker
            position={routePositions[routePositions.length - 1]}
            icon={goalIcon}
          />
        )}
        {routePositions.length > 0 && (
          <Marker
            position={routePositions[0]}
            icon={startIcon}
          />
        )}
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={currentLocationIcon}
          />
        )}
        {upcomingTurns.map((turn, index) => {
          if (!turn) return null;
          const isStart = turnPoints.length > 0 && turn.lat === turnPoints[0].lat && turn.lng === turnPoints[0].lng;
          const isGoal = turnPoints.length > 0 && turn.lat === turnPoints[turnPoints.length - 1].lat && turn.lng === turnPoints[turnPoints.length - 1].lng;

          if (isStart || isGoal) {
            return null;
          }

          const colorInfo = turnColors[index];

          return (
            <CircleMarker
              key={`upcoming-turn-${index}`}
              center={[turn.lat, turn.lng]}
              pathOptions={{
                color: 'white',
                weight: 2,
                fillColor: colorInfo.borderColor,
                fillOpacity: 0.8
              }}
              radius={8}
              pane="markerPane"
            />
          );
        })}
        <LocationTracker
          currentPosition={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
          energySaveMode={energySaveMode}
          isFollowing={isFollowing}
        />
      </MapContainer>

      <div className="absolute inset-0 z-[500] bg-gradient-to-b from-white/80 via-transparent via-25% to-transparent pointer-events-none" />

      <div className="absolute top-6 left-4 z-[1000]">
        <h1 className="text-black text-3xl font-bold drop-shadow-md">コース案内中</h1>
      </div>

      <div className="absolute top-6 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={toggleFollowing}
          className="flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-md"
        >
          {isFollowing ? <MdGpsFixed size={24} className="text-blue-600" /> : <MdGpsNotFixed size={24} className="text-black" />}
        </button>
        <button
          onClick={toggleShowSimplifiedRoute}
          className="flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-md"
        >
          {/* デバッグ用のシンプルなアイコン */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-6h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M5.636 18.364l-1.414 1.414" />
          </svg>
        </button>
        <button
          onClick={toggleEnergySaveMode}
          className="flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-md"
        >
          <HiMoon size={24} className="text-black" />
        </button>
      </div>

      <div className="absolute bottom-24 left-4 z-[1000] bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 w-60">
        <div className="relative">
          <div
            className="absolute left-[14px] top-[24px] w-1 h-[calc(100%-48px)] bg-gray-300"
            style={{
              background: "linear-gradient(to top, black 50%, #E5E7EB 50%)",
              backgroundSize: "100% 200%",
              animation: "fill-up 3s ease-out infinite",
            }}
          ></div>
          <div className="space-y-4">
            {[...upcomingTurns].reverse().map((turn, i) => {
              if (!turn) return null;

              const reversedIndex = upcomingTurns.length - 1 - i;
              const colorInfo = turnColors[reversedIndex];

              let IconComponent;
              const iconProps: { size: number; className: string } = {
                size: 32,
                className: "bg-[#FCFCFC] rounded-sm p-0.5",
              };

              const isStart = turnPoints.length > 0 && turn.lat === turnPoints[0].lat && turn.lng === turnPoints[0].lng;
              const isGoal = turnPoints.length > 0 && turn.lat === turnPoints[turnPoints.length - 1].lat && turn.lng === turnPoints[turnPoints.length - 1].lng;

              if (turn.turn === 'straight') {
                if (isStart) IconComponent = StartCharacter;
                else if (isGoal) IconComponent = GoalCharacter;
                else IconComponent = FaRunning;
              } else {
                IconComponent = turnIcons[turn.turn];
              }

              const showColorCircle = !isStart && !isGoal;

              return (
                <div key={i} className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 flex justify-center items-center">
                    <IconComponent {...iconProps} />
                  </div>
                  {showColorCircle && (
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: colorInfo.borderColor }}
                    />
                  )}
                  <div className={showColorCircle ? "" : "ml-6"}>
                    <span className="text-black font-bold text-2xl">
                      {turn.distance !== null ? Math.round(turn.distance / 10) * 10 : '...'}
                    </span>
                    <span className="text-black text-base ml-1">m</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 mt-2 relative z-10">
              <div className="w-8 h-8 flex justify-center items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md"></div>
              </div>
              <div>
                <span className="text-gray-700 text-xl font-bold">現在地</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-[1000]">
        <RoutingButton buttonText="案内を終了する" icon={FaRunning} onClick={handleBack} />
      </div>
    </div>
  );
}
