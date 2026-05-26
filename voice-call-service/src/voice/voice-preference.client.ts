/**
 * VoicePreferenceClient — consulta GET /auth/internal/voice-preference?phone=
 * al user-auth-service para resolver language + voice por phone E.164.
 *
 * Estrategia:
 *  - Cache LRU en memoria por phone (TTL 30min) para evitar hit por cada
 *    sesión Realtime.
 *  - Si user-auth-service no responde o tarda >2s, fallback a defaults.
 *  - Endpoint NO devuelve PII (solo {language, voice}) — safe to log.
 *
 * Auth: usa INTERNAL_SERVICE_TOKEN compartido (env var). Sin él, el endpoint
 * arriba retorna 401 y caemos a defaults.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VoicePreference {
  language: 'es' | 'en' | 'qu';
  voice: string | null;
}

interface CacheEntry {
  pref: VoicePreference;
  expiresAt: number;
}

@Injectable()
export class VoicePreferenceClient {
  private readonly logger = new Logger(VoicePreferenceClient.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly enabled: boolean;
  private readonly cache = new Map<string, CacheEntry>();
  /** TTL del cache en ms (30 min). */
  private readonly ttlMs = 30 * 60 * 1000;
  /** Cap de entradas en memoria — evita crecer indefinido. */
  private readonly maxEntries = 500;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('USER_AUTH_SERVICE_URL') ||
      'https://user-auth-service-780842550857.us-central1.run.app';
    this.token = this.config.get<string>('INTERNAL_SERVICE_TOKEN') || '';
    this.enabled = !!this.token;
    if (!this.enabled) {
      this.logger.warn(
        '[voice-pref] INTERNAL_SERVICE_TOKEN no configurado — siempre usaremos defaults',
      );
    }
  }

  /**
   * Resuelve la preferencia para un phone E.164. Si la lookup falla
   * o el cliente está deshabilitado, retorna null y el bridge usa
   * sus defaults env (VOICE_REALTIME_DEFAULT_LANG/VOICE).
   */
  async resolveByPhone(phone: string | undefined | null): Promise<VoicePreference | null> {
    if (!this.enabled || !phone) return null;

    const key = phone.trim();
    if (!key) return null;

    // Cache hit
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.pref;
    }

    try {
      const url = `${this.baseUrl}/auth/internal/voice-preference?phone=${encodeURIComponent(key)}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-internal-token': this.token },
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`[voice-pref] HTTP ${res.status} para phone=${key.slice(0, 4)}...`);
        return null;
      }
      const data = (await res.json()) as VoicePreference;
      this.putCache(key, data);
      return data;
    } catch (e) {
      this.logger.warn(
        `[voice-pref] lookup fallo phone=${key.slice(0, 4)}...: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      return null;
    }
  }

  /** Invalida el cache de un phone (útil tras un PUT /auth/me/voice-preference). */
  invalidate(phone: string): void {
    this.cache.delete(phone.trim());
  }

  private putCache(key: string, pref: VoicePreference): void {
    if (this.cache.size >= this.maxEntries) {
      // Eviction simple: borra la primera (FIFO, no LRU estricto).
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { pref, expiresAt: Date.now() + this.ttlMs });
  }
}

/**
 * Helper sin estado para escoger una voz default según idioma. Lo usamos
 * cuando user-auth devuelve language pero no voice, o cuando no hay user.
 *
 * Decisión (al 2026-05): tonos warm/female suenan más naturales en español
 * latino. Para inglés, sage (neutral/professional). Para kichwa, shimmer
 * (más cercano a fonética nativa según pruebas internas).
 */
export function defaultVoiceForLanguage(language: 'es' | 'en' | 'qu' | string): string {
  switch (language) {
    case 'en':
      return 'sage';
    case 'qu':
      return 'shimmer';
    case 'es':
    default:
      return 'shimmer';
  }
}
