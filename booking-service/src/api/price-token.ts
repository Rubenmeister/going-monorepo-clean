import * as jwt from 'jsonwebtoken';

/**
 * Token de precio firmado (auditoría B1 #9 — price tampering).
 *
 * POST /bookings/estimate calcula el precio AUTORITATIVO server-side y devuelve,
 * además del desglose, un `priceToken` firmado (HS256 con JWT_SECRET, efímero).
 * POST /bookings lo valida y usa su `total` como precio definitivo, ignorando el
 * totalPrice que mande el cliente. Así el cliente no puede inflar/deflactar el
 * precio (que alimenta la factura corporativa mensual). Es un token INTERNO del
 * booking-service (self-signed HS256, como el mfaToken de user-auth) — no es un
 * token de sesión, no necesita RS256.
 *
 * Rollout: en Fase 1 el token es OPCIONAL en create (se valida cuando viene). La
 * exigencia (rechazar create sin token) llega cuando webapp Y móvil lo envíen.
 */
export interface PriceTokenPayload {
  serviceId: string;
  serviceType: string;
  total: number;
  userId?: string;
  companyId?: string | null;
  clientSegment?: string;
}

const PURPOSE = 'booking-price';

export function signPriceToken(p: PriceTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado');
  return jwt.sign(
    {
      purpose: PURPOSE,
      serviceId: p.serviceId,
      serviceType: p.serviceType,
      total: p.total,
      userId: p.userId ?? null,
      companyId: p.companyId ?? null,
      clientSegment: p.clientSegment ?? null,
    },
    secret,
    { algorithm: 'HS256', expiresIn: '20m' },
  );
}

/**
 * Verifica el token y devuelve el payload, o null si es inválido/expirado/no es
 * un token de precio. El caller decide la política (usar su `total`).
 */
export function verifyPriceToken(token: string): (PriceTokenPayload & { purpose: string }) | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    if (decoded?.purpose !== PURPOSE) return null;
    return decoded;
  } catch {
    return null;
  }
}
