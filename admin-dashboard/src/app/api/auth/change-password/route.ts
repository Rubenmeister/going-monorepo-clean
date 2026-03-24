import { NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.AUTH_SERVICE_URL ||
  'https://user-auth-service-780842550857.us-central1.run.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';

    const res = await fetch(`${BACKEND}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin proxy /api/auth/change-password]', err);
    return NextResponse.json({ message: 'No se pudo conectar con el servidor.' }, { status: 503 });
  }
}
