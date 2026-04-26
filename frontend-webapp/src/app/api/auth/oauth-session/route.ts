import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie } from '@/lib/providers/session-cookie';

/**
 * PUT /api/auth/oauth-session — establece la cookie de sesión a partir de un
 * accessToken ya emitido por el flujo OAuth (Google/Facebook).
 *
 * El callback de OAuth (página /auth/callback) recibe el token en el query
 * string, lo guarda en localStorage para Authorization headers, y llama a
 * este endpoint para que el server fije la cookie httpOnly que necesita el
 * middleware. Sin este paso, el usuario quedaría autenticado solo del lado
 * del cliente y el middleware lo bloquearía al entrar a rutas protegidas.
 *
 * Nota: este endpoint no valida el token contra el backend. El token ya fue
 * emitido por el provider OAuth y validado durante el flujo. Esto es OK
 * porque la cookie por sí sola no autentica nada en backend — el backend
 * sigue exigiendo el Bearer token en cada request. La cookie es solo el
 * gate del middleware.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.accessToken || body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'accessToken requerido' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ ok: true });
    applySessionCookie(response);
    return response;
  } catch (err) {
    console.error('[proxy /api/auth/oauth-session]', err);
    return NextResponse.json(
      { message: 'No se pudo establecer la sesión.' },
      { status: 500 }
    );
  }
}
