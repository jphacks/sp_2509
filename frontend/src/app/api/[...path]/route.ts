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

  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // リクエストボディを安全に処理
    try {
      const textBody = await req.text();
      if (textBody) {
        body = textBody;
        // Content-Typeが設定されていない場合、jsonとして扱う
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }
    } catch (e) {
      // ボディの読み取りに失敗した場合は何もしない
    }
  }

  try {
    // バックエンドにリクエストを転送
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: body,
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
