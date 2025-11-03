"use client";

import { useState, useEffect } from "react";

export const useHeading = () => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const requestAndStart = async () => {
      let isPermissionGranted = false;
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permissionState = await (DeviceOrientationEvent as any).requestPermission();
          if (permissionState === 'granted') {
            isPermissionGranted = true;
          } else {
            console.error("Permission for DeviceOrientationEvent not granted.");
          }
        } catch (error) {
          console.error("Error requesting DeviceOrientationEvent permission:", error);
        }
      } else {
        // For non-iOS 13+ devices, permission is not required
        isPermissionGranted = true;
      }

      if (isPermissionGranted) {
        setPermissionGranted(true);
      }
    };

    requestAndStart();
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

  return { heading };
};
