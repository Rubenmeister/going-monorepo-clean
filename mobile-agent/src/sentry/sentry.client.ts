import { SentryIssue, SentryProjectStats, SentryRelease } from './types';

/**
 * Cliente HTTP minimalista para Sentry REST API. Sin SDK oficial — el SDK
 * de Sentry para Node está pensado para CAPTURAR errores, no para LEER
 * datos. Para ese caso usamos fetch directo + auth_token.
 *
 * Rate limits: Sentry permite 1 req/sec por org en tier free. El monitor
 * corre cada 6h y hace ~6 calls — no hay riesgo de hit limit. Si en el
 * futuro agregamos más apps, considerar throttle.
 */
export class SentryClient {
  constructor(
    private readonly token:   string,
    private readonly org:     string,
    private readonly apiBase: string = 'https://sentry.io/api/0',
  ) {}

  /**
   * Top issues no resueltos de un proyecto, ordenados por frecuencia.
   * statsPeriod soporta '1h', '24h', '7d', etc. — usar el mismo valor que
   * el cron del agent (default 6h).
   */
  async listTopIssues(args: {
    project:      string;
    statsPeriod:  string;
    limit?:       number;
  }): Promise<SentryIssue[]> {
    const params = new URLSearchParams({
      query:        'is:unresolved',
      statsPeriod:  args.statsPeriod,
      sort:         'freq',
      limit:        String(args.limit ?? 25),
    });
    return this.request<SentryIssue[]>(
      `/projects/${this.org}/${args.project}/issues/?${params}`,
    );
  }

  /**
   * Buckets de eventos por hora dentro de la ventana. Sentry los devuelve
   * incluso si no hay eventos (count=0) — útil para detectar caídas.
   */
  async getEventCounts(args: {
    project:      string;
    statsPeriod:  string;
  }): Promise<SentryProjectStats> {
    const params = new URLSearchParams({
      stat:        'received',
      resolution:  '1h',
      statsPeriod: args.statsPeriod,
    });
    // Sentry devuelve un array directo (no { data: [] }) pero lo wrappeamos
    // para tener un shape consistente con nuestro tipo.
    const data = await this.request<Array<[number, number]>>(
      `/projects/${this.org}/${args.project}/stats/?${params}`,
    );
    return { data: data as unknown as SentryProjectStats['data'] };
  }

  /** Releases recientes del proyecto — útil para detectar regresiones. */
  async listReleases(args: { project: string; limit?: number }): Promise<SentryRelease[]> {
    const params = new URLSearchParams({ per_page: String(args.limit ?? 10) });
    return this.request<SentryRelease[]>(
      `/projects/${this.org}/${args.project}/releases/?${params}`,
    );
  }

  // ─── Internals ──────────────────────────────────────────────

  private async request<T>(path: string): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      // Sentry generalmente responde rápido; 30s deja espacio para 99p.
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Sentry ${res.status} ${path}: ${body.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
}
