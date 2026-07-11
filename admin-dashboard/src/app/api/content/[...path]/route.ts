import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy server-side del PANEL DE COMUNICACIÓN (revisión editorial) →
 * customer-support-service /content-review/*.
 *
 * El panel del admin llama a ESTA ruta same-origin con el JWT admin en el
 * header Authorization; acá lo reenviamos tal cual a customer-support, que
 * exige JWT válido + role 'admin' (JwtAuthGuard + AdminGuard). No hay secreto
 * server-side que inyectar: el propio Bearer del admin es la credencial.
 *
 * Env (server-side, proyecto Vercel admin-dashboard):
 *   CONTENT_SERVICE_URL — base de customer-support-service
 *                         (default: Cloud Run conocido).
 */
export const dynamic = 'force-dynamic';

const SUPPORT_URL = (process.env.CONTENT_SERVICE_URL ||
  'https://customer-support-service-lw44cnhdeq-uc.a.run.app').replace(/\/$/, '');

async function proxy(req: NextRequest, path: string[]) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const target = `${SUPPORT_URL}/content-review/${path.join('/')}${req.nextUrl.search}`;
  const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.text();
  try {
    const res = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'No se pudo contactar el servicio de contenido', detail: (e as Error).message },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
