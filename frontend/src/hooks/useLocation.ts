"use client";

import { useState, useEffect, useRef } from "react";

export const useLocation = () => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // --- DEV MODE ---
      (window as any).debug_setLocation = (lat: number, lng: number) => {
        setCurrentPosition([lat, lng]);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        setCurrentPosition(prevPos => {
          if (!prevPos) return null;
          const delta = 0.0001;
          let [lat, lng] = prevPos;
          switch (e.key) {
            case 'w': lat += delta; break;
            case 's': lat -= delta; break;
            case 'a': lng -= delta; break;
            case 'd': lng += delta; break;
            default: return prevPos;
          }
          e.preventDefault();
          return [lat, lng];
        });
      };
      window.addEventListener('keydown', handleKeyDown);
      console.log('[Debug] Location mocking is enabled. Use arrow keys or `debug_setLocation(lat, lng)`.');

      // Get initial position for dev
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          p => setCurrentPosition(curr => curr || [p.coords.latitude, p.coords.longitude]),
          () => setCurrentPosition(curr => curr || [43.0621, 141.3544])
        );
      } else {
        setCurrentPosition(curr => curr || [43.0621, 141.3544]);
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        delete (window as any).debug_setLocation;
      };
    } else {
      // --- PRODUCTION MODE ---
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(newPos);
          },
          (error) => {
            console.error("位置情報の取得に失敗しました:", error);
            setCurrentPosition([43.0621, 141.3544]);
          }
        );
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(prevPos => {
              if (prevPos && prevPos[0] === newPos[0] && prevPos[1] === newPos[1]) {
                return prevPos;
              }
              return newPos;
            });
          },
          (error) => {
            console.error("位置情報の更新に失敗しました:", error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
        );
      } else {
        setCurrentPosition([43.0621, 141.3544]);
      }

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    }
  }, []);

  return currentPosition;
};
