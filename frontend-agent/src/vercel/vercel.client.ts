import { DeploymentsList, VercelDeployment } from './types';

/**
 * Cliente HTTP minimalista para Vercel REST API.
 *
 * Endpoints que usamos:
 *   GET /v6/deployments?app=<name>&since=<unix_ms> — deploys del proyecto
 *   GET /v13/deployments/<id>                       — detalle (incluye state final)
 *
 * Auth: Bearer token con scope read.
 *
 * Si la cuenta es team, todos los endpoints requieren el query param
 * `teamId=<slug-or-id>`. Lo agregamos automáticamente cuando configuran
 * VERCEL_TEAM_ID.
 *
 * Rate limits: 100 req/min en tier hobby/pro. El monitor hace ~6 calls
 * cada 6h, sin riesgo.
 */
export class VercelClient {
  constructor(
    private readonly token:  string,
    private readonly teamId: string | null,
    private readonly apiBase: string = 'https://api.vercel.com',
  ) {}

  /**
   * Deployments recientes de un proyecto, en orden inverso (más nuevos primero).
   * `since` filtra desde un timestamp en ms.
   */
  async listDeployments(args: {
    projectName: string;
    sinceMs:     number;
    limit?:      number;
  }): Promise<VercelDeployment[]> {
    const params = new URLSearchParams({
      app:    args.projectName,
      since:  String(args.sinceMs),
      limit:  String(args.limit ?? 30),
    });
    if (this.teamId) params.set('teamId', this.teamId);
    const res = await this.request<DeploymentsList>(`/v6/deployments?${params}`);
    return res.deployments || [];
  }

  // ─── Internals ──────────────────────────────────────────────

  private async request<T>(path: string): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Vercel ${res.status} ${path}: ${body.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
}
