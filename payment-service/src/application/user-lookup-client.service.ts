import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildInternalServiceHeaders } from '@going-monorepo-clean/shared-infrastructure';

export interface LookedUpUser {
  userId: string;
  firstName: string;
  lastName: string;
}

/**
 * Resuelve un usuario (por email o teléfono) a su userId, llamando al endpoint
 * interno de user-auth-service (`GET /auth/internal/lookup-user`) con firma
 * HMAC. Se usa para transferencias de wallet (identificar al receptor).
 */
@Injectable()
export class UserLookupClient {
  private readonly logger = new Logger(UserLookupClient.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('USER_AUTH_SERVICE_URL') || 'http://localhost:3001';
    this.token = this.config.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  async lookup(by: { email?: string; phone?: string }): Promise<LookedUpUser | null> {
    if (!this.token) {
      this.logger.warn('INTERNAL_SERVICE_TOKEN no configurado — no se puede resolver el receptor');
      return null;
    }
    const path = '/auth/internal/lookup-user';
    const qs = by.email
      ? `email=${encodeURIComponent(by.email)}`
      : by.phone
        ? `phone=${encodeURIComponent(by.phone)}`
        : '';
    if (!qs) return null;

    try {
      const headers = buildInternalServiceHeaders({
        secret: this.token,
        method: 'GET',
        path,
        caller: 'payment-service',
      });
      const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}?${qs}`, {
        headers: { ...headers, 'X-Internal-Token': this.token },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        this.logger.warn(`lookup-user respondió ${res.status}`);
        return null;
      }
      const d = (await res.json()) as { found?: boolean; userId?: string; firstName?: string; lastName?: string };
      if (!d?.found || !d.userId) return null;
      return { userId: d.userId, firstName: d.firstName ?? '', lastName: d.lastName ?? '' };
    } catch (e) {
      this.logger.error(`lookup-user error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }
}
