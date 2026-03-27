import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE =
  process.env.AUTH_SERVICE_URL ||
  'https://user-auth-service-780842550857.us-central1.run.app';

// ── Bypass de emergencia ──────────────────────────────────────────
// Define EMPRESAS_BYPASS_EMAIL y EMPRESAS_BYPASS_PASSWORD en Vercel
// para poder acceder sin depender del backend.
function makeEmpresasJWT(email: string): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub: 'empresas-bypass',
    email,
    roles: ['empresa'],
    isEmpresa: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  })).replace(/=/g, '');
  const sig = btoa('going-empresas-bypass').replace(/=/g, '');
  return `${header}.${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    // Bypass por variables de entorno
    const bypassEmail = process.env.EMPRESAS_BYPASS_EMAIL;
    const bypassPass  = process.env.EMPRESAS_BYPASS_PASSWORD;
    if (
      bypassEmail && bypassPass &&
      email?.toLowerCase() === bypassEmail.toLowerCase() &&
      password === bypassPass
    ) {
      const token = makeEmpresasJWT(email!);
      return NextResponse.json({ accessToken: token, bypass: true });
    }

    // Try corporate login first, fallback to regular login
    const res = await fetch(`${AUTH_SERVICE}/auth/corporate/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);

    // If corporate endpoint doesn't exist, try regular login
    const finalRes =
      res && res.status !== 404
        ? res
        : await fetch(`${AUTH_SERVICE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

    const data = await finalRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: finalRes.status });
  } catch (err) {
    console.error('[proxy /api/empresas/auth]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar al servidor.' },
      { status: 503 }
    );
  }
}
