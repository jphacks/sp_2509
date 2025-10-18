import { NextRequest, NextResponse } from 'next/server';

// このAPI_URLはサーバーサイドでのみ使用される環境変数です。
// Vercelの環境変数には `http://s1.ssnetwork.io:49714` を設定します。
// 環境変数が設定されていない場合、ローカル開発用にフォールバックします。
const API_URL = process.env.API_URL || 'http://localhost:8000';

async function handler(req: NextRequest) {
  // 元のリクエストパスから `/api` を取り除き、転送先のパスを作成
  const path = req.nextUrl.pathname.replace('/api', '');
  const url = `${API_URL}${path}${req.nextUrl.search}`;

  // ヘッダーをコピー
  const headers = new Headers(req.headers);
  headers.delete('host'); // fetchが自動的に正しいHostヘッダーを設定するように削除

  try {
    // バックエンドにリクエストを転送
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      // GET/HEAD以外の場合、リクエストボディを転送
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null,
      redirect: 'manual', // リダイレクトは手動で処理
    });

    // バックエンドからのレスポンスをそのままクライアントに返す
    return response;

  } catch (error) {
    console.error('API proxy error:', error);
    return new NextResponse('Proxy error', { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
export const OPTIONS = handler;
