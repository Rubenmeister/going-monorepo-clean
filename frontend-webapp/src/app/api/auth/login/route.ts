import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie } from '@/lib/providers/session-cookie';

/**
 * POST /api/auth/login — login con email/password.
 *
 * Forwardea las credenciales al user-auth-service y, si el backend devuelve
 * un accessToken válido, setea la cookie httpOnly going_webapp_session=1
 * para que el middleware permita el acceso a rutas protegidas.
 *
 * El cliente sigue recibiendo accessToken/refreshToken/user en el body para
 * usarlos en localStorage y Authorization headers de subsiguientes requests.
 */

const BACKEND = process.env.AUTH_SERVICE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });

    // Solo setea la cookie si el backend devolvió un token válido
    const token = data?.accessToken || data?.token;
    if (res.ok && token) {
      applySessionCookie(response);
    }

    return response;
  } catch (err) {
    console.error('[proxy /api/auth/login]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
