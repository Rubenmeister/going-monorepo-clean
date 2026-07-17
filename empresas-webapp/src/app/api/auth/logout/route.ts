import { NextRequest, NextResponse } from 'next/server';
import { clearEmpresasSessionCookie } from '@/lib/empresas-cookie';

/**
 * POST /api/empresas/auth/logout — cierra sesión empresas.
 *
 * Limpia la cookie httpOnly going_empresas_session. Best-effort: también
 * intenta revocar el token en el backend (si el cliente envía Authorization
 * header en la request), pero no falla si la revocación remota no responde.
 *
 * El cliente debe limpiar también su localStorage (empresas_authToken,
 * empresas_refreshToken, empresas_userInfo) tras llamar a este endpoint.
 */

const BACKEND =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.goingec.com';

export async function POST(req: NextRequest) {
  // Intento best-effort de revocar el token en el backend
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    let body: unknown = {};
    try {
      body = await req.json().catch(() => ({}));
    } catch {
      // body opcional, ignoramos
    }
    fetch(`${BACKEND}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    }).catch(() => {
      /* revocación remota best-effort, no rompe el logout */
    });
  }

  const response = NextResponse.json({ ok: true });
  clearEmpresasSessionCookie(response);
  return response;
}
