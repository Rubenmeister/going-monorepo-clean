import { Injectable, Logger } from '@nestjs/common';
import { AgentConfig } from './agent-registry';

/**
 * Cliente HTTP para invocar acciones en services always-on (customer-support,
 * cerebro). El service del lado del agente expone un endpoint
 * `/<service>/command` que acepta:
 *   { decisionId, action, payload }
 *
 * y responde:
 *   { ok: boolean, data?: any, error?: string }
 *
 * Si los services todavía no exponen `/command` (eso lo agregamos cuando
 * empecemos a ejecutar acciones reales), el bridge devuelve error y el
 * Orchestrator marca la decision como 'failure'.
 */
@Injectable()
export class HttpServiceClient {
  private readonly logger = new Logger(HttpServiceClient.name);

  async sendCommand(args: {
    agentId:    string;
    config:     AgentConfig;
    decisionId: string;
    action:     string;
    payload:    Record<string, unknown>;
  }): Promise<{
    ok:    boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    if (!args.config.serviceUrl) {
      return { ok: false, error: 'agent_config_missing_serviceUrl' };
    }

    const url =
      args.config.serviceUrl.replace(/\/$/, '') +
      (args.config.commandPath || '/command');
    const t0 = Date.now();

    // S2S auth: el receiver (customer-support /support/command) ahora
    // requiere X-Internal-Token. Lo enviamos siempre que tengamos el env
    // var. Si no está configurado, log warning pero seguimos (durante
    // bootstrap puede no estar bound y el receiver dará 401 — visible).
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (!internalToken) {
      this.logger.warn(`INTERNAL_SERVICE_TOKEN no configurado — el receiver puede rechazar`);
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (internalToken) headers['X-Internal-Token'] = internalToken;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          decisionId: args.decisionId,
          action:     args.action,
          payload:    args.payload,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const ms = Date.now() - t0;

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(
          `HTTP ${res.status} from ${args.agentId} (${url}) in ${ms}ms: ${body.slice(0, 200)}`,
        );
        return {
          ok: false,
          error: `http_${res.status}: ${body.slice(0, 200)}`,
        };
      }

      const json = (await res.json()) as { ok?: boolean; data?: Record<string, unknown>; error?: string };
      this.logger.log(
        `HTTP command ${args.agentId}/${args.action} OK in ${ms}ms`,
      );
      return {
        ok:    json.ok !== false,
        data:  json.data,
        error: json.error,
      };
    } catch (e) {
      const err = (e as Error).message;
      this.logger.error(`HTTP exception calling ${url}: ${err}`);
      return { ok: false, error: `http_exception: ${err}` };
    }
  }
}
