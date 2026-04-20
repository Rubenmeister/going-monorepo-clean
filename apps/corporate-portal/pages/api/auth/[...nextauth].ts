import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * DEPRECATED — next-auth fue removido del corporate-portal.
 *
 * Las rutas de autenticación ahora las sirve directamente `user-auth-service`
 * vía el API Gateway. Este handler queda como stub para que Next.js no falle
 * si alguien guardó un link antiguo a `/api/auth/...`, devolviendo 410 Gone.
 *
 * Puede borrarse cuando se confirme que no hay callers externos.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    error: 'gone',
    message:
      'next-auth was removed. Use /auth/login (email/password) or /auth/google (OAuth) via the user-auth-service.',
  });
}
