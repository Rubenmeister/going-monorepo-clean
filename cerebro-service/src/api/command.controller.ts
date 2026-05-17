import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  HttpCode,
  Injectable,
  Logger,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AgentEventRepository } from '../infrastructure/persistence/agent-event.repository';

interface CommandBody {
  decisionId: string;
  action:     string;
  payload?:   Record<string, unknown>;
}

interface CommandResponse {
  ok:    boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * InternalServiceGuard — solo permite llamadas con X-Internal-Token válido.
 * Antes el endpoint era 100% público; cualquiera podía inyectar anomalías
 * fake al cerebro o crash-loop con bad payloads.
 */
@Injectable()
class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers?.['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('Internal auth misconfigured');
    }
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid or missing X-Internal-Token');
    }
    return true;
  }
}

/**
 * Endpoint que recibe comandos del agent-bridge-service (Orchestrator).
 * Auth: InternalServiceGuard — exige header X-Internal-Token que el
 * agent-bridge ya envía (post AUTH Batch 1).
 *
 * Acciones soportadas hoy:
 *   - log_anomaly  → registra una anomalía explícitamente en el cerebro
 *                    (útil para que el orchestrator deje rastro de
 *                    decisiones tomadas a partir de patrones cross-agente)
 */
@Controller('cerebro')
@UseGuards(InternalServiceGuard)
export class CommandController {
  private readonly logger = new Logger(CommandController.name);

  constructor(private readonly events: AgentEventRepository) {}

  @Post('command')
  @HttpCode(200)
  async handleCommand(@Body() body: CommandBody): Promise<CommandResponse> {
    if (!body?.action) {
      return { ok: false, error: 'missing_action' };
    }

    this.logger.log(
      `[command] decision=${body.decisionId?.slice(0, 8)} action=${body.action}`,
    );

    try {
      switch (body.action) {
        case 'log_anomaly':
          return await this.logAnomaly(body.decisionId, body.payload || {});
        default:
          return { ok: false, error: `unknown_action: ${body.action}` };
      }
    } catch (e) {
      this.logger.error(`[command] action ${body.action} threw: ${(e as Error).message}`);
      return { ok: false, error: (e as Error).message };
    }
  }

  /**
   * Registra una anomalía explícita como un AgentEvent del orchestrator.
   * Esto deja rastro auditable de qué cosas el cerebro/orchestrator
   * detectaron como anomalía a partir de razonamiento cross-agente.
   *
   * Idempotente por decisionId — si ya hay un evento con ese runId,
   * el repo retorna false y no duplica.
   */
  private async logAnomaly(
    decisionId: string,
    payload: Record<string, unknown>,
  ): Promise<CommandResponse> {
    const type = (payload.type as string) || 'orchestrator_logged';
    const severity =
      (payload.severity as 'info' | 'warning' | 'critical') || 'info';
    const message = (payload.message as string) || 'Anomaly logged by orchestrator';

    // Pseudo-event para mantener trazabilidad. Lo persistimos en
    // cerebro_agent_events bajo un agentId virtual 'orchestrator'. Cuando
    // el WorldModelService corra, va a ver esta anomalía como cualquier
    // otra y la incluirá en el snapshot.
    const now = new Date();
    const inserted = await this.events.save({
      agentId:    'orchestrator-service' as any, // virtual — no está en AGENT_IDS
      runId:      decisionId,                    // unique → idempotencia
      startedAt:  now.toISOString(),
      finishedAt: now.toISOString(),
      durationMs: 0,
      status:     'success',
      metrics:    {},
      anomalies: [
        {
          type,
          severity,
          message,
          data: payload,
        },
      ],
      actionsTaken:    [],
      actionsProposed: [],
      meta: {
        gitSha: process.env.GIT_SHA,
        runEnv: 'production',
      },
    });

    return { ok: true, data: { inserted } };
  }
}
