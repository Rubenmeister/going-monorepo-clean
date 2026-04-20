import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * OAuth State Service
 *
 * Firma y verifica el parámetro `state` de OAuth para transportar de forma
 * segura la URL de `returnTo` (a qué app/dominio volver después del callback).
 *
 * Por qué: OAuth tiene un único callback URL registrado en Google/Meta, pero
 * tenemos múltiples apps (admin, corporate, webapp). Usamos `state` (firmado
 * con JWT para que no sea manipulable) y validamos el `returnTo` contra una
 * whitelist (`ALLOWED_RETURN_URLS`) para evitar ataques de open-redirect.
 */
@Injectable()
export class OauthStateService {
  private readonly logger = new Logger(OauthStateService.name);
  private readonly stateTtl = '10m'; // El flujo OAuth rara vez dura más de unos segundos

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Firma un `returnTo` dentro de un token JWT corto.
   * El token se pasa como parámetro `state` al proveedor OAuth.
   */
  sign(returnTo: string): string {
    return this.jwtService.sign(
      { returnTo },
      { expiresIn: this.stateTtl }
    );
  }

  /**
   * Verifica el `state` recibido en el callback y extrae el `returnTo`.
   * Devuelve `null` si es inválido / expirado.
   */
  verify(state: string | undefined): string | null {
    if (!state) return null;
    try {
      const payload = this.jwtService.verify<{ returnTo: string }>(state);
      return payload.returnTo ?? null;
    } catch (err) {
      this.logger.warn(
        `Invalid OAuth state: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }
  }

  /**
   * Valida que la URL de returnTo esté en la whitelist configurada.
   * Devuelve la URL validada o `null` si no está permitida.
   *
   * La whitelist se define en la env `ALLOWED_RETURN_URLS`, separada por coma.
   * Ejemplo: "https://app.goingec.com,https://admin.goingec.com,https://corporate.goingec.com"
   */
  validateReturnTo(returnTo: string | null | undefined): string | null {
    if (!returnTo) return null;

    const allowed = (process.env.ALLOWED_RETURN_URLS ?? '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    if (allowed.length === 0) {
      this.logger.warn(
        'ALLOWED_RETURN_URLS no está configurada — OAuth returnTo será ignorado.'
      );
      return null;
    }

    try {
      const parsed = new URL(returnTo);
      // Comparamos por origin (protocolo + host + puerto). Así permitimos
      // cualquier path dentro de la app (ej. /auth/callback, /dashboard, etc.)
      const isAllowed = allowed.some((a) => {
        try {
          return new URL(a).origin === parsed.origin;
        } catch {
          return false;
        }
      });

      if (!isAllowed) {
        this.logger.warn(
          `returnTo rechazado (no está en whitelist): ${parsed.origin}`
        );
        return null;
      }

      return returnTo;
    } catch {
      this.logger.warn(`returnTo mal formado: ${returnTo}`);
      return null;
    }
  }
}
