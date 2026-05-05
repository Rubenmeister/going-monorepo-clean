import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.AUTH_SERVICE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forzar rol admin en el registro desde este panel
    const payload = { ...body, roles: ['admin'] };

    const res = await fetch(`${BACKEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin proxy /api/auth/register]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
