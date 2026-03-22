import { NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';

    const res = await fetch(`${BACKEND}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[proxy /api/auth/refresh]', err);
    return NextResponse.json(
      { message: 'No se pudo refrescar la sesión.' },
      { status: 503 }
    );
  }
}
