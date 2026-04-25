import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID, createHmac } from 'crypto';
import type { FareQuote, FareQuoteInput } from './fare-engine.service';

/**
 * QuoteStore — locker de quotes con TTL.
 *
 * Cuando el FareEngine genera un quote, lo persistimos en Redis bajo
 * `going:quote:<quoteId>` durante 5 min. Luego al confirmar la reserva,
 * el caller pasa el quoteId; nosotros lo recuperamos y validamos:
 *
 *   1. Existe → no expiró.
 *   2. La firma HMAC matchea (anti-tamper en clientes hostiles).
 *   3. El userId del JWT coincide con el guardado al crear el quote.
 *
 * Esto previene que el cliente manipule el precio en transit.
 *
 * Si Redis está caído, fallamos abierto: el quote no se persiste,
 * el caller recibe `quoteId: null` y debe re-cotizar antes de confirmar
 * (lo cual es correcto desde el punto de vista de seguridad).
 */

const QUOTE_KEY_PREFIX = 'going:quote:';
const QUOTE_TTL_SECONDS = 300; // 5 minutos
const SIG_SECRET_ENV = 'JWT_SECRET'; // reuse del JWT secret para firmar

export interface StoredQuote extends FareQuote {
  quoteId: string;
  signature: string;
  userId?: string;
  createdAt: string;
  expiresAt: string;
  /** Eco del input para auditoría / re-cálculo si hace falta. */
  input: FareQuoteInput;
}

@Injectable()
export class QuoteStore implements OnModuleDestroy {
  private readonly logger = new Logger(QuoteStore.name);
  private redis!: Redis;
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = config.get<string>(SIG_SECRET_ENV, 'default-secret');
  }

  private getRedis(): Redis {
    if (this.redis) return this.redis;
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    // Permitir offline queue para que la PRIMERA llamada no falle mientras
    // se establece el socket TLS (Upstash). Mantenemos lazyConnect:true
    // para no bloquear el boot del service si Redis cae.
    this.redis = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
    });
    this.redis.on('error', (e) =>
      this.logger.warn(`Redis error: ${e.message}`),
    );
    return this.redis;
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  /** Firma `total + quoteId + userId` para detectar tampering en confirm. */
  private sign(payload: { total: number; quoteId: string; userId?: string }): string {
    const msg = `${payload.quoteId}|${payload.total.toFixed(2)}|${payload.userId ?? ''}`;
    return createHmac('sha256', this.secret).update(msg).digest('hex');
  }

  /**
   * Guarda el quote y devuelve el StoredQuote enriquecido (id + sig).
   * Si Redis falla, retorna el quote sin id/sig (caller decide qué hacer).
   */
  async save(
    quote: FareQuote,
    input: FareQuoteInput,
    userId?: string,
  ): Promise<StoredQuote | null> {
    const quoteId = randomUUID();
    const signature = this.sign({ total: quote.total, quoteId, userId });
    const now = new Date();
    const stored: StoredQuote = {
      ...quote,
      quoteId,
      signature,
      userId,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + QUOTE_TTL_SECONDS * 1000).toISOString(),
      input,
    };

    try {
      await this.getRedis().setex(
        `${QUOTE_KEY_PREFIX}${quoteId}`,
        QUOTE_TTL_SECONDS,
        JSON.stringify(stored),
      );
      this.logger.debug(`Quote ${quoteId} guardado (TTL ${QUOTE_TTL_SECONDS}s, total=$${quote.total})`);
      return stored;
    } catch (e) {
      this.logger.warn(
        `Redis falló al guardar quote: ${(e as Error).message}. Devolviendo quote sin lock.`,
      );
      return null;
    }
  }

  /**
   * Recupera y valida un quote por id.
   * Retorna null si:
   *   - no existe (expiró)
   *   - signature no matchea (tampering)
   *   - userId del JWT no coincide con el del quote
   */
  async claim(
    quoteId: string,
    expectedUserId?: string,
  ): Promise<StoredQuote | null> {
    if (!quoteId) return null;
    let raw: string | null = null;
    try {
      raw = await this.getRedis().get(`${QUOTE_KEY_PREFIX}${quoteId}`);
    } catch (e) {
      this.logger.warn(`Redis get falló: ${(e as Error).message}`);
      return null;
    }
    if (!raw) {
      this.logger.warn(`Quote ${quoteId} no existe o expiró`);
      return null;
    }

    const stored = JSON.parse(raw) as StoredQuote;

    // Re-firma con el secret actual y compara constante-tiempo.
    const expectedSig = this.sign({
      total: stored.total,
      quoteId: stored.quoteId,
      userId: stored.userId,
    });
    if (expectedSig !== stored.signature) {
      this.logger.error(
        `Quote ${quoteId} firma inválida — posible tampering en Redis`,
      );
      return null;
    }

    if (
      expectedUserId &&
      stored.userId &&
      expectedUserId !== stored.userId
    ) {
      this.logger.warn(
        `Quote ${quoteId} pertenece a user ${stored.userId} pero lo reclama ${expectedUserId}`,
      );
      return null;
    }

    return stored;
  }

  /** Borra un quote (ej. al confirmar la reserva — single-use). */
  async invalidate(quoteId: string): Promise<void> {
    if (!quoteId) return;
    try {
      await this.getRedis().del(`${QUOTE_KEY_PREFIX}${quoteId}`);
    } catch {
      /* no-op — TTL lo limpiará */
    }
  }
}
