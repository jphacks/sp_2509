"use client";

import React, { useState, useMemo } from "react";
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import { HiMoon } from "react-icons/hi";
import { MdOutlineTurnLeft, MdOutlineTurnRight, MdOutlineUTurnRight, MdGpsFixed, MdGpsNotFixed } from "react-icons/md";
import { FaRunning } from "react-icons/fa";
import { useRouter } from "next/navigation";
import RoutingButton from "./RoutingButton";
import { useLocation } from "../hooks/useLocation";
import { currentLocationIcon, startIcon, goalIcon } from "./MapIcons";
import EnergySaveMode from "./EnergySaveMode";
import { useMapEvents } from "react-leaflet";
import { GradientPolyline, LocationTracker } from "./MapComponents";
import { TurnPoint } from "../app/navigation/page"; // page.tsxから型をインポート

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
  const { useState, useEffect } = React;
  const [nextTurnIndex, setNextTurnIndex] = useState(0);
  const [upcomingTurnsWithDistances, setUpcomingTurnsWithDistances] = useState<Array<TurnPoint & { distance: number | null }>>([]);
  const [isApproaching, setIsApproaching] = useState(false); //ターンポイント30m以内に入ったかどうか


  useEffect(() => {
    if (!currentPosition || turnPoints.length === 0 || nextTurnIndex >= turnPoints.length) {
      setUpcomingTurnsWithDistances(turnPoints.slice(nextTurnIndex, nextTurnIndex + 3).map(turn => ({ ...turn, distance: null })));
      return;
    }

    const nextTurnPoint = turnPoints[nextTurnIndex];
    const distanceToFirst = getDistance(currentPosition, nextTurnPoint);

    const approachingThreshold = 30; // 30m以内
    const isCurrentlyApproaching = distanceToFirst < approachingThreshold;

    if (isCurrentlyApproaching) {
      if (!isApproaching) {
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

export default function NavigationMap({ routeData, simplifiedRoute, turnPoints }: NavigationMapProps) {
  const router = useRouter();
  const currentPositionArray = useLocation();
  const currentPosition = useMemo(() =>
    currentPositionArray ? { lat: currentPositionArray[0], lng: currentPositionArray[1] } : null,
    [currentPositionArray]
  );
  const { upcomingTurns } = useNavigation(turnPoints, currentPosition);
  const [energySaveMode, setEnergySaveMode] = useState(false);
  const [showSimplifiedRoute, setShowSimplifiedRoute] = useState(false); // デバッグ用フラグ
  const [isFollowing, setIsFollowing] = useState(true);

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
