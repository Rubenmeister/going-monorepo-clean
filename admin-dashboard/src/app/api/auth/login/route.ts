import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.AUTH_SERVICE_URL || 'https://api.goingec.com';

/**
 * /api/auth/login — proxy del Next.js admin-dashboard al backend.
 *
 * Antes existía un "bypass de emergencia" que aceptaba credenciales
 * desde env vars (ADMIN_BYPASS_EMAIL/PASSWORD) y generaba un JWT
 * sintético con firma falsa (`btoa('going-bypass-signature')`). Eso
 * era un backdoor: cualquiera con acceso a Vercel podía entrar como
 * admin sin tocar el backend, y el JWT no se validaba contra el
 * JWT_SECRET real. Eliminado para evitar riesgo de privilege
 * escalation.
 *
 * Si necesitas un admin de emergencia, usa POST /auth/bootstrap-admin
 * en user-auth-service o crea el admin directamente vía MongoDB.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin proxy /api/auth/login]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
