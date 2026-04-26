/**
 * Helpers server-side para manejar la cookie de sesión del webapp.
 *
 * La cookie es httpOnly + Secure (en producción) + SameSite=Lax y la setean
 * exclusivamente los route handlers de /api/auth/*. El middleware la lee.
 *
 * El cliente NO puede leer ni escribir esta cookie. Para login usa el proxy
 * /api/auth/login (POST) o /api/auth/oauth-session (PUT). Para logout llama
 * a /api/auth/logout (POST).
 */

import { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'going_webapp_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

const isProd = process.env.NODE_ENV === 'production';

/**
 * Aplica la cookie de sesión a una NextResponse ya construida.
 * Devuelve la misma response para encadenar.
 */
export function applySessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '1',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/**
 * Limpia la cookie de sesión en una NextResponse.
 */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
