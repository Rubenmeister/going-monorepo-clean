import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentRunEvent,
  Anomaly,
  ActionProposed,
  publishAgentRunEvent,
} from '@going-platform/cerebro-contracts';
import { MetricsService, SupportMetricsSnapshot } from './metrics.service';

/**
 * Publisher del customer-support-service al cerebro-service.
 *
 * customer-support es HTTP always-on (recibe webhooks 24/7), no cron como
 * los otros 5 agentes. Para mantener el contrato AgentRunEvent uniforme,
 * publicamos un snapshot agregado cada 10 min. Ventajas:
 *   - 1 forma de procesar eventos en el cerebro (no event-driven + batch).
 *   - Latencia 0-10 min aceptable para el caso (los humanos ya monitorean
 *     Telegram en tiempo real para emergencias urgentes).
 *
 * TODO Fase 4 (MyCortex): cuando llegue un handoff con priority=RED y no
 * haya operador asignado, publicar evento INMEDIATO sin esperar al cron.
 * Hoy ese path no es necesario — los operadores ya reciben alerta directa
 * por Telegram via HandoffNotifierService.
 */
@Injectable()
export class CerebroPublisherService {
  private readonly logger = new Logger(CerebroPublisherService.name);

  constructor(private readonly metrics: MetricsService) {}

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'cerebro-publish-snapshot',
  })
  async publishSnapshot(): Promise<void> {
    const startedAt = new Date();
    const runId     = uuidv4();

    let snapshot: SupportMetricsSnapshot;
    try {
      snapshot = await this.metrics.snapshot(10);
    } catch (err) {
      this.logger.error(
        `Failed to compute metrics snapshot for cerebro publish: ${(err as Error).message}`,
      );
      // Aún así publicamos un evento "failure" para que el cerebro sepa que
      // el agente HTTP siguió arriba pero no pudo introspectar Mongo.
      const finishedAt = new Date();
      await this.publish({
        runId,
        startedAt,
        finishedAt,
        status: 'failure',
        snapshot: null,
        anomalies: [{
          type: 'metrics_snapshot_failed',
          severity: 'warning',
          message: `customer-support no pudo computar snapshot: ${(err as Error).message.slice(0, 200)}`,
        }],
        actionsProposed: [],
      });
      return;
    }

    const finishedAt = new Date();
    const { anomalies, actionsProposed } = this.deriveAnomalies(snapshot);

    await this.publish({
      runId,
      startedAt,
      finishedAt,
      status: 'success',
      snapshot,
      anomalies,
      actionsProposed,
    });
  }

  /**
   * Reglas para derivar anomalías y propuestas a partir del snapshot.
   * Determinísticas, deliberadamente simples — el razonamiento complejo
   * vive en MyCortex (Fase 4) sobre el world model agregado.
   */
  private deriveAnomalies(s: SupportMetricsSnapshot): {
    anomalies: Anomaly[];
    actionsProposed: ActionProposed[];
  } {
    const anomalies: Anomaly[] = [];
    const actionsProposed: ActionProposed[] = [];

    // RED unattended >5 min = critical (alguien con emergencia / accidente
    // / robo esperando humano demasiado tiempo).
    if (s.pendingHandoffsRed > 0 && s.oldestRedHandoffAgeMinutes >= 5) {
      anomalies.push({
        type: 'red_priority_unattended',
        severity: 'critical',
        message: `${s.pendingHandoffsRed} handoff(s) RED esperando atención humana — el más viejo lleva ${s.oldestRedHandoffAgeMinutes} min`,
        data: {
          count: s.pendingHandoffsRed,
          oldestAgeMinutes: s.oldestRedHandoffAgeMinutes,
        },
      });
      actionsProposed.push({
        type: 'page_oncall_operator',
        reason: `RED priority sin atender ${s.oldestRedHandoffAgeMinutes} min`,
        urgency: 0.95,
        data: { count: s.pendingHandoffsRed },
      });
    }

    // ORANGE unattended >15 min = warning (cliente frustrado).
    if (s.pendingHandoffsOrange > 0 && s.oldestOrangeHandoffAgeMinutes >= 15) {
      anomalies.push({
        type: 'orange_priority_unattended',
        severity: 'warning',
        message: `${s.pendingHandoffsOrange} handoff(s) ORANGE esperando — más viejo ${s.oldestOrangeHandoffAgeMinutes} min`,
        data: {
          count: s.pendingHandoffsOrange,
          oldestAgeMinutes: s.oldestOrangeHandoffAgeMinutes,
        },
      });
    }

    // Cola de handoffs creciendo: >10 pendientes sostenidos = falta capacidad.
    if (s.pendingHandoffs > 10) {
      anomalies.push({
        type: 'handoff_queue_growing',
        severity: 'warning',
        message: `${s.pendingHandoffs} handoffs pendientes — capacidad operativa insuficiente`,
        data: {
          pending: s.pendingHandoffs,
          operators: s.operatorsConfigured,
        },
      });
      actionsProposed.push({
        type: 'add_more_operators',
        reason: `${s.pendingHandoffs} handoffs en cola con ${s.operatorsConfigured} operadores configurados`,
        urgency: s.pendingHandoffs > 20 ? 0.8 : 0.5,
        data: { pending: s.pendingHandoffs, operators: s.operatorsConfigured },
      });
    }

    // Sin operadores configurados = el bot no puede escalar a humanos.
    if (s.operatorsConfigured === 0 && s.pendingHandoffs > 0) {
      anomalies.push({
        type: 'no_operators_configured',
        severity: 'critical',
        message: `Hay ${s.pendingHandoffs} handoffs pendientes pero OPERATOR_TELEGRAM_CHAT_IDS está vacío — nadie recibe las alertas`,
      });
      actionsProposed.push({
        type: 'configure_operators',
        reason: 'Sin operadores configurados, el handoff a humano queda en limbo',
        urgency: 1.0,
      });
    }

    return { anomalies, actionsProposed };
  }

  /** Compone el AgentRunEvent y lo publica con el helper compartido. */
  private async publish(args: {
    runId:        string;
    startedAt:    Date;
    finishedAt:   Date;
    status:       'success' | 'partial_failure' | 'failure';
    snapshot:     SupportMetricsSnapshot | null;
    anomalies:    Anomaly[];
    actionsProposed: ActionProposed[];
  }): Promise<void> {
    // El cerebro espera un Record<string, number|string> en metrics. Aplanamos
    // el snapshot quitando el generatedAt (string ISO va igual, pero si lo
    // dejáramos type-mixed podría confundir consumidores).
    const metrics: Record<string, number | string> = {};
    if (args.snapshot) {
      for (const [k, v] of Object.entries(args.snapshot)) {
        if (typeof v === 'number' || typeof v === 'string') {
          metrics[k] = v;
        }
      }
    }

    const event: AgentRunEvent = {
      agentId:    'customer-support-service',
      runId:      args.runId,
      startedAt:  args.startedAt.toISOString(),
      finishedAt: args.finishedAt.toISOString(),
      durationMs: args.finishedAt.getTime() - args.startedAt.getTime(),
      status:     args.status,
      metrics,
      anomalies:      args.anomalies,
      actionsTaken:   [],          // No-op: este snapshot no ejecuta nada,
                                   // las acciones (alertas, sends, etc.) ya
                                   // las hicieron los controllers en su momento.
      actionsProposed: args.actionsProposed,
      meta: {
        gitSha: process.env.GIT_SHA,
        runEnv: (process.env.NODE_ENV === 'production' ? 'production' : 'staging'),
      },
    };

    await publishAgentRunEvent(event, { logger: this.bridgeLogger() }).catch(e =>
      this.logger.error(`Cerebro publish failed (non-fatal): ${(e as Error).message}`),
    );
  }

  /** Adapta el Logger de Nest al shape que espera el helper. */
  private bridgeLogger() {
    return {
      log:   (msg: string) => this.logger.log(msg),
      warn:  (msg: string) => this.logger.warn(msg),
      error: (msg: string, err?: unknown) => this.logger.error(msg, err as any),
    };
  }
}
