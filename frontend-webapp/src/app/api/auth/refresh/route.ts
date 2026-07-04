import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie } from '@/lib/providers/session-cookie';

const BACKEND = process.env.AUTH_SERVICE_URL || 'https://api.goingec.com';

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
    const response = NextResponse.json(data, { status: res.status });

    // Sesión deslizante: cada refresh exitoso renueva la cookie httpOnly 7 días
    // más, para que un usuario activo no tenga que volver a loguearse.
    const token = data?.accessToken || data?.token;
    if (res.ok && token) {
      applySessionCookie(response);
    }

    return response;
  } catch (err) {
    console.error('[proxy /api/auth/refresh]', err);
    return NextResponse.json(
      { message: 'No se pudo refrescar la sesión.' },
      { status: 503 }
    );
  }
}
