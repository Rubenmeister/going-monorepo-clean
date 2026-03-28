import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * TokenService — genera y valida tokens para:
 *  - pickupToken:   QR de identidad del pasajero/paquete al recoger
 *  - deliveryToken: código de confirmación de entrega
 *  - shareToken:    link público de seguimiento en tiempo real
 */
@Injectable()
export class TokenService {

  /**
   * Genera un token de recogida (pickup QR).
   * El conductor escanea este QR para confirmar que recogió al pasajero/paquete correcto.
   * Formato: base64url de "rideId:userId:timestamp:hmac"
   */
  generatePickupToken(rideId: string, userId: string): string {
    const ts      = Date.now();
    const payload = `${rideId}:${userId}:${ts}`;
    const hmac    = this.sign(payload);
    return Buffer.from(`${payload}:${hmac}`).toString('base64url');
  }

  /**
   * Genera el token de entrega (delivery confirmation).
   * Se genera al iniciar el viaje — el receptor lo muestra para confirmar entrega.
   * Para paquetes: el conductor toma foto + ingresa este código.
   */
  generateDeliveryToken(rideId: string): string {
    // 6 dígitos numéricos — fácil de leer/dictar en persona
    const hash = crypto.createHmac('sha256', this.secret())
      .update(`delivery:${rideId}:${Date.now()}`)
      .digest('hex');
    return hash.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
  }

  /**
   * Genera el shareToken para el link público de seguimiento.
   * Formato: base64url de "rideId-randomBytes"
   */
  generateShareToken(rideId: string): string {
    const random = crypto.randomBytes(8).toString('hex');
    return Buffer.from(`${rideId}-${random}`).toString('base64url');
  }

  /**
   * Extrae el rideId de un shareToken.
   * Retorna null si el token es inválido.
   */
  decodeShareToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      return decoded.split('-')[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica un pickupToken.
   * Retorna { valid, rideId, userId } o { valid: false }.
   */
  verifyPickupToken(token: string): { valid: boolean; rideId?: string; userId?: string } {
    try {
      const decoded  = Buffer.from(token, 'base64url').toString('utf8');
      const parts    = decoded.split(':');
      if (parts.length < 4) return { valid: false };

      const [rideId, userId, ts, hmac] = parts;
      const payload  = `${rideId}:${userId}:${ts}`;
      const expected = this.sign(payload);

      // Comparación segura contra timing attacks
      if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
        return { valid: false };
      }

      // Tokens válidos por 24 horas
      const age = Date.now() - parseInt(ts, 10);
      if (age > 24 * 60 * 60 * 1000) return { valid: false };

      return { valid: true, rideId, userId };
    } catch {
      return { valid: false };
    }
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private sign(payload: string): string {
    return crypto.createHmac('sha256', this.secret())
      .update(payload)
      .digest('hex')
      .slice(0, 16);   // primeros 16 chars son suficientes
  }

  private secret(): string {
    return process.env.JWT_SECRET ?? 'going-token-secret-fallback';
  }
}
