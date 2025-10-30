import L from "leaflet";

// 現在位置アイコン（青い点）
export const currentLocationIcon = L.divIcon({
  html: `
    <div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// スタートピンアイコン（青 - コースの開始色）
export const startIcon = L.divIcon({
  html: `
    <svg width="48" height="60" viewBox="0 0 40 50">
      <path d="M20 5c-6.5 0-12 5.5-12 12 0 8 10 18 11.5 19.5.3.3.7.3 1 0C22 35 32 25 32 17c0-6.5-5.5-12-12-12z"
            fill="#20B950" stroke="#16A34A" stroke-width="2"/>
      <circle cx="20" cy="17" r="8" fill="white"/>
      <text x="20" y="21" text-anchor="middle" fill="#20B950" font-size="12" font-weight="bold">S</text>
    </svg>
  `,
  className: "",
  iconSize: [48, 60],
  iconAnchor: [24, 44],
});

// ゴールピンアイコン（緑 - コースの終了色）
export const goalIcon = L.divIcon({
  html: `
    <svg width="48" height="60" viewBox="0 0 40 50">
      <path d="M20 5c-6.5 0-12 5.5-12 12 0 8 10 18 11.5 19.5.3.3.7.3 1 0C22 35 32 25 32 17c0-6.5-5.5-12-12-12z"
            fill="#444444" stroke="#222222" stroke-width="2"/>
      <circle cx="20" cy="17" r="8" fill="white"/>
      <text x="20" y="21" text-anchor="middle" fill="#222222" font-size="12" font-weight="bold">G</text>
    </svg>
  `,
  className: "",
  iconSize: [48, 60],
  iconAnchor: [24, 44],
});
