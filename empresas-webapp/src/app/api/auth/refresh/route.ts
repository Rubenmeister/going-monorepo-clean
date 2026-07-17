import { NextRequest, NextResponse } from 'next/server';
import { applyEmpresasSessionCookie } from '@/lib/empresas-cookie';

/**
 * POST /api/empresas/auth/refresh — renueva el access token corporativo.
 *
 * El cliente envía { refreshToken } en el body. Forwardeamos al backend.
 * Si el refresh es exitoso, devolvemos el nuevo accessToken al cliente y
 * extendemos la cookie de sesión httpOnly (renovamos su Max-Age).
 */

const BACKEND =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.goingec.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'refreshToken requerido' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });

    const newToken = data?.accessToken || data?.token;
    if (res.ok && newToken) {
      applyEmpresasSessionCookie(response);
    }

    return response;
  } catch (err) {
    console.error('[proxy /api/empresas/auth/refresh]', err);
    return NextResponse.json(
      { message: 'No se pudo renovar la sesión.' },
      { status: 503 }
    );
  }
}
