'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート
import Carousel from '../../components/Carousel_iwai'; // Carouselコンポーネントをインポート

export default function Home() {

    const router = useRouter(); // useRouterを初期化

      // カルーセルで表示する画像のリスト
    const carouselImages = [
        '/images/testImage.png',
        '/images/testImage.png',
        '/images/testImage.png',
        '/images/testImage.png',
    ];

    // Aboutページに遷移する関数
    const navigateToDraw = () => {
    router.push('/draw');
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Home Page</h1>

          <Carousel images={carouselImages} />


          {/* ボタンによるページ遷移 */}
          <button
            onClick={navigateToDraw}
            className="mt-4 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg shadow-md hover:bg-zinc-700 focus:outline-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            新しいルートを作る
          </button>

        </div>
      </div>
    </main>
  );
}