/**
 * GitHub Copilot 機能デモコンポーネント
 * 
 * このコンポーネントは GitHub Copilot の機能を実演するために作成されました。
 * バックエンドの /api/copilot-demo エンドポイントからデータを取得して表示します。
 */

'use client';

import { useState, useEffect } from 'react';

interface DemoResults {
  current_jst_time: string;
  distance_tokyo_to_osaka: number;
  sample_hash: string;
  uuid_validation: {
    valid: boolean;
    invalid: boolean;
  };
  pagination_example: {
    items: number[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  clamped_value: number;
}

interface CopilotDemoResponse {
  message: string;
  capabilities: string[];
  demo_results: DemoResults;
}

export default function CopilotDemo() {
  const [data, setData] = useState<CopilotDemoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/copilot-demo');
        
        if (!response.ok) {
          throw new Error('Failed to fetch demo data');
        }
        
        const result: CopilotDemoResponse = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">エラーが発生しました</h2>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          バックエンドサーバーが起動しているか確認してください
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🤖 GitHub Copilot デモ</h1>
        <p className="text-lg opacity-90">{data.message}</p>
      </div>

      {/* 機能一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          📋 実装された機能
        </h2>
        <ul className="space-y-2">
          {data.capabilities.map((capability, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-gray-700">{capability}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* デモ結果 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          🔬 実行結果
        </h2>
        
        <div className="space-y-4">
          {/* 現在時刻 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-700">現在時刻 (JST)</h3>
            <p className="text-gray-600">{data.demo_results.current_jst_time}</p>
          </div>

          {/* 距離計算 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-700">東京-大阪間の距離</h3>
            <p className="text-gray-600">{data.demo_results.distance_tokyo_to_osaka} km</p>
          </div>

          {/* ハッシュ値 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-700">ハッシュ値 (SHA-256)</h3>
            <p className="text-gray-600 text-xs break-all font-mono">
              {data.demo_results.sample_hash}
            </p>
          </div>

          {/* UUID検証 */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-700">UUID検証</h3>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600">
                有効なUUID: {data.demo_results.uuid_validation.valid ? '✓' : '✗'}
              </span>
              <span className="text-red-600">
                無効なUUID: {data.demo_results.uuid_validation.invalid ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* ページネーション */}
          <div className="border-l-4 border-pink-500 pl-4">
            <h3 className="font-semibold text-gray-700">ページネーション例</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>ページ: {data.demo_results.pagination_example.page} / {data.demo_results.pagination_example.total_pages}</p>
              <p>表示アイテム: {data.demo_results.pagination_example.items.join(', ')}</p>
              <p>総数: {data.demo_results.pagination_example.total} 件</p>
            </div>
          </div>

          {/* 値の制限 */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-700">値の範囲制限</h3>
            <p className="text-gray-600">
              150 を 0-100 の範囲に制限 → {data.demo_results.clamped_value}
            </p>
          </div>
        </div>
      </div>

      {/* フッター情報 */}
      <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
        <p>このデモは GitHub Copilot によって自動生成されたコードで実装されています</p>
        <p className="mt-1">詳細は <code className="bg-gray-200 px-2 py-1 rounded">COPILOT_CAPABILITIES.md</code> を参照</p>
      </div>
    </div>
  );
}
