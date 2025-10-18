'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート

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