/**
 * Helpers server-side para la cookie de sesión del portal de empresas.
 *
 * La cookie es httpOnly + Secure (en producción) + SameSite=Lax y la setean
 * exclusivamente los route handlers de /api/empresas/auth/*. El middleware
 * la lee para proteger /empresas/panel/*.
 *
 * El cliente NO puede leer ni escribir esta cookie. Para login pasa por
 * /api/empresas/auth/login, para logout por /api/empresas/auth/logout, y
 * para refresh por /api/empresas/auth/refresh.
 *
 * Equivalente a session-cookie.ts pero para el portal corporate, separado
 * porque usa un nombre de cookie distinto (going_empresas_session) y un
 * scope de auth distinto.
 */

import { NextResponse } from 'next/server';

export const EMPRESAS_SESSION_COOKIE_NAME = 'going_empresas_session';
export const EMPRESAS_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

const isProd = process.env.NODE_ENV === 'production';

/**
 * Aplica la cookie de sesión empresas a una NextResponse.
 * Devuelve la misma response para encadenar.
 */
export function applyEmpresasSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: EMPRESAS_SESSION_COOKIE_NAME,
    value: '1',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: EMPRESAS_SESSION_MAX_AGE,
  });
  return res;
}

/**
 * Limpia la cookie de sesión empresas en una NextResponse.
 */
export function clearEmpresasSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: EMPRESAS_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
