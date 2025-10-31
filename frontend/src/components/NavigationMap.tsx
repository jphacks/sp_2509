"use client";

import React, { useState } from "react";
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import { HiMoon } from "react-icons/hi";
import { MdOutlineTurnLeft, MdOutlineTurnRight, MdOutlineUTurnRight } from "react-icons/md";
import { FaRunning } from "react-icons/fa";
import { useRouter } from "next/navigation";
import RoutingButton from "./RoutingButton";
import { useLocation } from "../hooks/useLocation";
import { currentLocationIcon, startIcon, goalIcon } from "./MapIcons";
import EnergySaveMode from "./EnergySaveMode";
import { GradientPolyline, LocationTracker } from "./MapComponents";
import { TurnPoint } from "../app/navigation/page"; // page.tsxから型をインポート

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

const turnIcons: { [key in 'left' | 'right' | 'u-turn']: IconType } = {
  left: MdOutlineTurnLeft,
  right: MdOutlineTurnRight,
  'u-turn': MdOutlineUTurnRight,
};


export default function NavigationMap({ routeData, simplifiedRoute, turnPoints }: NavigationMapProps) {
  const router = useRouter();
  const currentPosition = useLocation();
  const [energySaveMode, setEnergySaveMode] = useState(false);
  const [showSimplifiedRoute, setShowSimplifiedRoute] = useState(false); // デバッグ用フラグ

  const routePositions: [number, number][] = routeData.route_points.map(p => [p.lat, p.lng]);
  const simplifiedRoutePositions: [number, number][] = simplifiedRoute.map(p => [p.lat, p.lng]);

  const initialCenter: [number, number] = currentPosition ||
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
              <IconComponent size={24} className="text-black" />
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
        <LocationTracker
          currentPosition={currentPosition}
          energySaveMode={energySaveMode}
        />
      </MapContainer>

      <div className="absolute inset-0 z-[500] bg-gradient-to-b from-white/80 via-transparent via-25% to-transparent pointer-events-none" />

      <div className="absolute top-6 left-4 z-[1000]">
        <h1 className="text-black text-3xl font-bold drop-shadow-md">コース案内中</h1>
      </div>

      <div className="absolute top-6 right-4 z-[1000] flex gap-2">
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
            className="absolute left-[15px] top-[24px] w-1 h-[calc(100%-48px)] bg-gray-300"
            style={{
              background: "linear-gradient(to top, black 50%, #E5E7EB 50%)",
              backgroundSize: "100% 200%",
              animation: "fill-up 3s ease-out infinite",
            }}
          ></div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 flex justify-center items-center">
                <MdOutlineTurnRight size={32} className="bg-white rounded-sm p-1" />
              </div>
              <div>
                <span className="text-black font-bold text-2xl">320</span>
                <span className="text-black text-base ml-1">m</span>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 flex justify-center items-center">
                <MdOutlineTurnLeft size={32} className="bg-white rounded-sm p-1" />
              </div>
              <div>
                <span className="text-black font-bold text-2xl">240</span>
                <span className="text-black text-base ml-1">m</span>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 flex justify-center items-center">
                <MdOutlineUTurnRight size={32} className="bg-white rounded-sm p-1" />
              </div>
              <div>
                <span className="text-black font-bold text-2xl">100</span>
                <span className="text-black text-base ml-1">m</span>
              </div>
            </div>
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
