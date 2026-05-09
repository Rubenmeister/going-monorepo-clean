import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente HTTP del agent-bridge-service. El bridge sabe cómo despachar a
 * cada tipo de agente (Cloud Run Job vs HTTP Service) — el Orchestrator
 * solo dice "agent X, action Y, args Z".
 *
 * El bridge es un service separado para mantener al Orchestrator
 * desacoplado de Google Cloud APIs. Si mañana cambia la forma de
 * despachar (ej. event bus en lugar de jobs execute), solo se toca el
 * bridge.
 */
@Injectable()
export class AgentBridgeClient {
  private readonly logger = new Logger(AgentBridgeClient.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return (
      this.config.get<string>('AGENT_BRIDGE_URL') ||
      'https://agent-bridge-service-780842550857.us-central1.run.app'
    ).replace(/\/$/, '');
  }

  /**
   * Despacha una acción al agent-bridge. Devuelve outcome estructurado.
   * Si el bridge devuelve 4xx/5xx o no responde, se considera failure.
   */
  async dispatch(args: {
    decisionId:  string;
    agentId:     string;
    action:      string;
    payload:     Record<string, unknown>;
  }): Promise<{
    ok:          boolean;
    outcomeData?: Record<string, unknown>;
    error?:      string;
  }> {
    const url = `${this.baseUrl}/agents/${args.agentId}/command`;
    const t0 = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: args.decisionId,
          action:     args.action,
          payload:    args.payload,
        }),
        // 60s timeout — algunas acciones (ej. trigger Cloud Run Job)
        // pueden tardar varios segundos en confirmarse.
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`bridge ${url} respondió ${res.status}: ${body.slice(0, 300)}`);
        return { ok: false, error: `bridge_${res.status}: ${body.slice(0, 200)}` };
      }

      const json = (await res.json()) as { ok: boolean; data?: Record<string, unknown>; error?: string };
      const ms = Date.now() - t0;
      this.logger.log(
        `dispatched ${args.agentId}/${args.action} in ${ms}ms — ok=${json.ok}`,
      );
      return { ok: json.ok, outcomeData: json.data, error: json.error };
    } catch (err) {
      this.logger.error(`bridge unreachable (${url}): ${(err as Error).message}`);
      return { ok: false, error: `bridge_unreachable: ${(err as Error).message}` };
    }
  }
}
