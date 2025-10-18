'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート
import Carousel from '../../components/Carousel'; // Carouselコンポーネントをインポート

export default function Home() {

  const router = useRouter(); // useRouterを初期化

  // カルーセルで表示するアイテムのリスト
  const carouselItems = [
    { src: '/images/sample4.png', alt: 'Slide 1', description: '走りたいルートの形を書く' },
    { src: '/images/whiteblue.png', alt: 'Slide 2', description: '走り始める場所とおおよその長さを決める' },
    { src: '/images/sample4.png', alt: 'Slide 3', description: '説明文3' },
    { src: '/images/sample4.png', alt: 'Slide 4', description: '説明文4' },
  ];

  // Aboutページに遷移する関数
  const navigateToDraw = () => {
    router.push('/draw');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">How to Use</h1>

          <div className="-mx-4">
            <Carousel
              items={carouselItems}
              imageBorderRadius="rounded-2xl"
              textClassName="text-white"
            />
          </div>

          {/* ボタンによるページ遷移 */}
          <button
            onClick={navigateToDraw}
            className="mt-4 px-6 py-3 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-zinc-700 focus:outline-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            新しいルートを作る
          </button>

        </div>
      </div>
    </main>
  );
}
