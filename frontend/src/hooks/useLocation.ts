"use client";

import { useState, useEffect, useRef } from "react";

export const useLocation = () => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentPosition(prevPos => {
            if (prevPos && prevPos[0] === newPos[0] && prevPos[1] === newPos[1]) {
              return prevPos;
            }
            return newPos;
          });
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
          setCurrentPosition([43.0621, 141.3544]); // デフォルト位置（札幌）
        }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
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
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );
    } else {
      setCurrentPosition([43.0621, 141.3544]); // デフォルト位置（札幌）
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return currentPosition;
};
