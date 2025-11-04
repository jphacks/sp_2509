"use client";

import { useState, useEffect, useCallback } from "react";

export const useHeading = () => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          return true;
        } else {
          console.error("Permission for DeviceOrientationEvent not granted.");
          setPermissionGranted(false);
          return false;
        }
      } catch (error) {
        console.error("Error requesting DeviceOrientationEvent permission:", error);
        setPermissionGranted(false);
        return false;
      }
    } else {
      // For non-iOS 13+ devices, permission is not required or granted by default
      setPermissionGranted(true);
      return true;
    }
  }, []);

  useEffect(() => {
    // For non-iOS 13+ devices that don't require explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = (event as any).webkitCompassHeading ?? event.alpha;
      if (alpha !== null) {
        setHeading(alpha);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [permissionGranted]);

  return { heading, permissionGranted, requestPermission };
};
