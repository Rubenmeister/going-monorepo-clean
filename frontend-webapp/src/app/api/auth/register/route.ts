import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie } from '@/lib/providers/session-cookie';

/**
 * POST /api/auth/register — alta de cuenta.
 *
 * Forwardea al user-auth-service. Si el registro es exitoso y el backend
 * devuelve un accessToken (auto-login), setea también la cookie httpOnly
 * de sesión para que el middleware permita rutas protegidas inmediatamente.
 */

const BACKEND = process.env.AUTH_SERVICE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });

    const token = data?.accessToken || data?.token;
    if (res.ok && token) {
      applySessionCookie(response);
    }

    return response;
  } catch (err) {
    console.error('[proxy /api/auth/register]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
