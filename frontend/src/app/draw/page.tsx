'use client';
import { useRouter } from 'next/navigation'; // useRouterをインポート


export default function Draw() {

    const router = useRouter(); // useRouterを初期化


    // Aboutページに遷移する関数
    const navigateToCondition = () => {
    router.push('/condition');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
            <div className="text-center">
            <h1 className="text-4xl font-bold">Draw Page</h1>
            <p className="mt-4 text-lg">
                This is Drawpage.
            </p>


            {/* ボタンによるページ遷移 */}
            <button
                onClick={navigateToCondition}
                className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
                Go to Condition Page (Button)
            </button>

            </div>
        </div>
        </main>
    );
}