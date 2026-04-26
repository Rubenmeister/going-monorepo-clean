import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/providers/session-cookie';

/**
 * POST /api/auth/logout — cierra sesión limpiando la cookie httpOnly.
 *
 * El cliente debe limpiar también su localStorage (authToken, refreshToken,
 * auth-store) tras llamar a este endpoint. La cookie por sí sola no
 * autentica al usuario en el backend; este endpoint solo asegura que el
 * middleware deje de permitir el acceso a rutas protegidas.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
