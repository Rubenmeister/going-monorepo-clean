import { NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.AUTH_SERVICE_URL ||
  'https://user-auth-service-780842550857.us-central1.run.app';

// ── Bypass de emergencia ─────────────────────────────────────────
// Si ADMIN_BYPASS_EMAIL y ADMIN_BYPASS_PASSWORD están definidos en Vercel
// (o .env.local), el login funciona sin pasar por el backend.
// Genera un JWT sintético válido para el middleware del dashboard.
function makeSyntheticJWT(email: string): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub: 'admin-bypass',
    email,
    roles: ['admin'],
    isAdmin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8h
  })).replace(/=/g, '');
  const sig = btoa('going-bypass-signature').replace(/=/g, '');
  return `${header}.${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    // Bypass por variables de entorno (solo si están configuradas)
    const bypassEmail = process.env.ADMIN_BYPASS_EMAIL;
    const bypassPass  = process.env.ADMIN_BYPASS_PASSWORD;

    if (
      bypassEmail && bypassPass &&
      email?.toLowerCase() === bypassEmail.toLowerCase() &&
      password === bypassPass
    ) {
      const token = makeSyntheticJWT(email!);
      return NextResponse.json({ accessToken: token, bypass: true });
    }

    // Flujo normal → backend
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
