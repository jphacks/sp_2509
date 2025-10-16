'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート

export default function Route() {

    const router = useRouter(); // useRouterを初期化

    //遷移関数

    const navigateToHome = () => {
    router.push('/home');
    }

    const navigateToDraw = () => {
    router.push('/draw');
    }

    const navigateToCondition = () => {
    router.push('/condition');
    }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Route Page</h1>
          <p className="mt-4 text-lg">
            This is Route page.
          </p>


          {/* ボタンによるページ遷移 */}
          <button
            onClick={navigateToHome}
            className="mt-4 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg shadow-md hover:bg-zinc-700 focus:outline-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            Go to Home Page (Button)
          </button>

          <button
            onClick={navigateToDraw}
            className="mt-4 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg shadow-md hover:bg-zinc-700 focus:outline-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            Go to Draw Page (Button)
          </button>

          <button
            onClick={navigateToCondition}
            className="mt-4 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg shadow-md hover:bg-zinc-700 focus:outline-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            Go to Route Condition (Button)
          </button>

        </div>
      </div>
    </main>
  );
}