import { NextRequest, NextResponse } from 'next/server';
import { applyEmpresasSessionCookie } from '@/lib/empresas-cookie';

/**
 * POST /api/empresas/auth/mfa-verify-login — segundo paso del login MFA.
 *
 * Forwarda { mfaToken, code } al backend /auth/mfa/verify-login. Si el code
 * verifica, backend emite tokens reales y este proxy setea la cookie
 * httpOnly going_empresas_session=1 igual que el login normal.
 */
const BACKEND =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.goingec.com';

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
    if (res.ok && token) {
      applyEmpresasSessionCookie(response);
    }
    return response;
  } catch (err) {
    console.error('[proxy /api/empresas/auth/mfa-verify-login]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
