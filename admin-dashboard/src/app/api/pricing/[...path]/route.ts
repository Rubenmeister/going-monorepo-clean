import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy server-side del PANEL DE TARIFAS → pricing-service /admin/*.
 *
 * El motor protege /admin/* con `x-admin-token` (secret). El browser NUNCA debe
 * ver ese token, así que el panel llama a ESTA ruta (same-origin) con el JWT
 * admin; acá:
 *   1. Verificamos que quien llama sea ADMIN (GET /auth/admin/stats con su JWT).
 *   2. Reenviamos a pricing-service /admin/<path> inyectando el x-admin-token.
 *
 * Env (server-side, en el proyecto Vercel del admin-dashboard):
 *   PRICING_ADMIN_URL   — base del pricing-service (default: Cloud Run conocido).
 *   PRICING_ADMIN_TOKEN — el secret x-admin-token del motor (requerido).
 *   NEXT_PUBLIC_API_URL — gateway (para verificar admin). Default api.goingec.com.
 */

export const dynamic = 'force-dynamic';

const PRICING_URL = (process.env.PRICING_ADMIN_URL ||
  'https://pricing-service-lw44cnhdeq-uc.a.run.app').replace(/\/$/, '');
const API = (process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com').replace(/\/$/, '');

async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  try {
    const r = await fetch(`${API}/auth/admin/stats`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok; // /auth/admin/stats devuelve 200 SOLO a admins
  } catch {
    return false;
  }
}

async function proxy(req: NextRequest, path: string[]) {
  const token = process.env.PRICING_ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'PRICING_ADMIN_TOKEN no configurado en el servidor' }, { status: 500 });
  }
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'No autorizado (se requiere admin)' }, { status: 401 });
  }
  const target = `${PRICING_URL}/admin/${path.join('/')}${req.nextUrl.search}`;
  const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.text();
  const res = await fetch(target, {
    method: req.method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };
export async function GET(req: NextRequest, ctx: Ctx) { return proxy(req, (await ctx.params).path); }
export async function POST(req: NextRequest, ctx: Ctx) { return proxy(req, (await ctx.params).path); }
export async function PATCH(req: NextRequest, ctx: Ctx) { return proxy(req, (await ctx.params).path); }
export async function DELETE(req: NextRequest, ctx: Ctx) { return proxy(req, (await ctx.params).path); }
