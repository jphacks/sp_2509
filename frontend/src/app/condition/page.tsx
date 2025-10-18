'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート
import  DrawnShapeImage  from '../../components/DrawnShapeImage';
import type { Point } from '../../types/types';

// 例: ハート型の座標配列 (ダミー)
const heartShape: Point[] = [
    { x: 175, y: 100 }, { x: 205, y: 70 }, { x: 235, y: 80 }, { x: 250, y: 110 },
    { x: 235, y: 140 }, { x: 175, y: 210 }, { x: 115, y: 140 }, { x: 100, y: 110 },
    { x: 115, y: 80 }, { x: 145, y: 70 }, { x: 175, y: 100 }
].map(p => ({ x: p.x * 350 / 300, y: p.y * 350 / 300 })); // サイズに合わせて調整

export default function Condition() {

    const router = useRouter(); // useRouterを初期化


    // Aboutページに遷移する関数
    const navigateToRoute = () => {
    router.push('/route');
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Condition Page</h1>
          <p className="mt-4 text-lg">
            条件設定
          </p>

          <p className="mt-2 text-md">
            あなたの書いたコース
          </p>

          <DrawnShapeImage
            points={heartShape} // ダミーの座標データ
            size={200}
            strokeColor='red'
          />
          

          {/* ボタンによるページ遷移 */}
          <button
            onClick={navigateToRoute}
            className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          >
            Go to Route Page (Button)
          </button>

        </div>
      </div>
    </main>
  );
}