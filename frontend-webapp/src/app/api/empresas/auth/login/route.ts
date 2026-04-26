import { NextRequest, NextResponse } from 'next/server';
import { applyEmpresasSessionCookie } from '@/lib/empresas/empresas-cookie';

/**
 * POST /api/empresas/auth/login — login del portal de empresas.
 *
 * Forwardea las credenciales al endpoint corporate del user-auth-service.
 * Si el backend devuelve un accessToken válido, setea la cookie httpOnly
 * going_empresas_session=1 para que el middleware permita el acceso a
 * /empresas/panel/*.
 *
 * El cliente recibe en el body { accessToken, refreshToken, user, companyId,
 * companyName, ... } para guardarlos en localStorage y usarlos en
 * Authorization headers de subsiguientes requests.
 */

const BACKEND =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/auth/corporate/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });

    // Solo setea la cookie si el backend devolvió un token válido (login exitoso)
    const token = data?.accessToken || data?.token;
    if (res.ok && token) {
      applyEmpresasSessionCookie(response);
    }

    return response;
  } catch (err) {
    console.error('[proxy /api/empresas/auth/login]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
