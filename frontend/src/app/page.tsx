"use client";

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessage = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/message`);
      if (!res.ok) {
        throw new Error('Failed to fetch message');
      }
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Sample App</h1>

          <button
            onClick={fetchMessage}
            disabled={isLoading}
            className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 w-[250px]"
          >
            {isLoading ? 'Loading...' : 'Get Message from Backend'}
          </button>

          <div className="mt-6 min-h-[60px]">
            {error && <p className="mt-2 text-red-500">{error}</p>}
            {message && (
              <div>
                <p className="mt-4 text-lg">
                  Message from backend:
                </p>
                <p className="mt-2 text-2xl font-semibold text-green-500">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
