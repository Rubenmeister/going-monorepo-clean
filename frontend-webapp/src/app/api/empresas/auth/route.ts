import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE =
  process.env.AUTH_SERVICE_URL ||
  'https://user-auth-service-780842550857.us-central1.run.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Try corporate login first, fallback to regular login
    const res = await fetch(`${AUTH_SERVICE}/auth/corporate/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);

    // If corporate endpoint doesn't exist, try regular login
    const finalRes =
      res && res.status !== 404
        ? res
        : await fetch(`${AUTH_SERVICE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

    const data = await finalRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: finalRes.status });
  } catch (err) {
    console.error('[proxy /api/empresas/auth]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar al servidor.' },
      { status: 503 }
    );
  }
}
