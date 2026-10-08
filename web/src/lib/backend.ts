import { NextResponse } from 'next/server';

/** Base URL of the Rust/Axum backend. */
export const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Forwards the incoming request (method, JSON body and Authorization header) to
 * the Rust backend and relays its response verbatim. The Next.js API layer is a
 * thin proxy so that all reads/writes are persisted in the SQLite database.
 */
export async function forward(req: Request, path: string): Promise<NextResponse> {
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    if (text) body = text;
  }

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { error: `Cannot reach the Rust backend at ${BACKEND_URL}. Start it with "cd backend && cargo run".` },
      { status: 502 },
    );
  }
}
