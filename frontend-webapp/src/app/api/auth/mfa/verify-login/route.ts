import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie } from '@/lib/providers/session-cookie';

/**
 * POST /api/auth/mfa/verify-login — segundo paso del login cuando el usuario
 * tiene 2FA activado. Recibe { mfaToken, code }, lo reenvía a user-auth-service
 * y, si devuelve tokens, setea la cookie httpOnly de sesión (igual que el
 * proxy de /api/auth/login).
 */
const BACKEND = process.env.AUTH_SERVICE_URL || 'https://api.goingec.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/auth/mfa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    const token = data?.accessToken || data?.token;
    if (res.ok && token) applySessionCookie(response);
    return response;
  } catch (err) {
    console.error('[proxy /api/auth/mfa/verify-login]', err);
    return NextResponse.json({ message: 'No se pudo conectar con el servidor.' }, { status: 503 });
  }
}
