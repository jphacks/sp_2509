"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ACCENT_AMBER } from '@/lib/color';

type DisplayPoint = {
  x: number;
  y: number;
};

type Handwriting = {
  id: string;
  drawing_points: DisplayPoint[];
  created_at: string;
};

const ExpoPage: React.FC = () => {
  const [handwritings, setHandwritings] = useState<Handwriting[]>([]);
  const [since, setSince] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHandwritings = async (fetchSince: string | null) => {
    try {
      const apiBaseUrl = "/api";
      let url = `${apiBaseUrl}/handwritings`;
      if (fetchSince) {
        url += `?since=${encodeURIComponent(fetchSince)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const data: Handwriting[] = await res.json();
      setHandwritings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchHandwritings(since);
    const interval = setInterval(() => fetchHandwritings(since), 60000); // 1分ごとに再取得
    return () => clearInterval(interval);
  }, [since]);

  const handleSinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // JSTで入力された日時を、タイムゾーン付きのISO文字列(UTC)に変換してAPIに送信します
      const jstDate = new Date(e.target.value);
      setSince(jstDate.toISOString());
    } else {
      setSince(null);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">EXPOで書かれた一筆書き</h1>
        </header>
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <input
              type="datetime-local"
              id="since"
              name="since"
              onChange={handleSinceChange}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {handwritings.map((hw) => (
            <div key={hw.id} className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <DrawingPreview drawingPoints={hw.drawing_points} createdAt={hw.created_at} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DrawingPreview: React.FC<{ drawingPoints: DisplayPoint[], createdAt: string }> = ({ drawingPoints, createdAt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || drawingPoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    let minX = drawingPoints[0].x, maxX = drawingPoints[0].x;
    let minY = drawingPoints[0].y, maxY = drawingPoints[0].y;
    drawingPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const drawingWidth = maxX - minX;
    const drawingHeight = maxY - minY;

    if (drawingWidth === 0 && drawingHeight === 0) return;

    const scale = Math.min(width / drawingWidth, height / drawingHeight) * 0.9;
    const offsetX = (width - drawingWidth * scale) / 2 - minX * scale;
    const offsetY = (height - drawingHeight * scale) / 2 - minY * scale;

    ctx.strokeStyle = ACCENT_AMBER;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    drawingPoints.forEach((p, index) => {
      const x = p.x * scale + offsetX;
      const y = p.y * scale + offsetY;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

  }, [drawingPoints]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-48" />
      <p className="absolute bottom-1 right-2 text-xs text-gray-400">
        {new Date(createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
      </p>
    </div>
  );
};

export default ExpoPage;
