import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentRunEvent,
  Anomaly,
  ActionProposed,
  publishAgentRunEvent,
} from '@going-platform/cerebro-contracts';
import { VoiceCallRepository } from '../infrastructure/persistence/voice-call.repository';

/**
 * Publisher de eventos del voice-call-service (Uyari) al cerebro (Pacha).
 *
 * Mismo patrón que customer-support-service:
 *  - Snapshot batch cada 10 min con anomalies/proposals agregadas
 *  - Eventos inmediatos para casos urgentes (suspicious_pattern, etc.)
 *
 * STUB inicial: los métodos publishCallStarted / publishCallEnded /
 * publishSuspiciousPattern son llamables desde VoiceCallService pero por
 * ahora solo loggean. El wiring real a Pub/Sub se activa cuando:
 *   1. CEREBRO_EVENT_TOPIC esté configurado en env
 *   2. El service tenga credentials GCP para publish (workload identity
 *      o GOOGLE_APPLICATION_CREDENTIALS)
 *
 * El snapshot @Cron sí está estructurado para activarse cuando el service
 * se deploye con min-instances=1 (igual que booking-service / orchestrator).
 */
@Injectable()
export class CerebroPublisherService {
  private readonly logger = new Logger(CerebroPublisherService.name);
  private readonly enabled: boolean;
  private readonly projectId: string;

  constructor(private readonly repo: VoiceCallRepository) {
    this.enabled = process.env.CEREBRO_PUBLISH_ENABLED === 'true';
    this.projectId = process.env.GCP_PROJECT_ID || 'going-5d1ae';
    if (!this.enabled) {
      this.logger.warn(
        '[cerebro] CEREBRO_PUBLISH_ENABLED != true — eventos solo se loggean, no se publican a Pub/Sub',
      );
    }
  }

  // ── Eventos inmediatos (publicados al instante, no esperan al cron) ──

  /**
   * Llamada iniciada — informativo. Pacha agrega al world model
   * (volumen/hora, distribución horaria, picos de demanda).
   */
  async publishCallStarted(input: {
    runId: string;
    callId: string;
    from: string;
    startedAt: string;
  }): Promise<void> {
    this.logger.log(`[cerebro] call_started callId=${input.callId} from=${input.from} runId=${input.runId.slice(0, 8)}`);
    // TODO Fase 4: si CEREBRO_PUBLISH_ENABLED, publicar evento inmediato.
    // Por ahora se incluye en el snapshot batch del cron.
  }

  /**
   * Llamada finalizada — el evento crítico para análisis. Incluye outcome,
   * sentiment, intent. Mycortex razona sobre patrones (tasa abandonment,
   * sentiment burst negativo, intents repetidos sin resolver).
   */
  async publishCallEnded(input: {
    runId: string;
    callId: string;
    outcome: 'resolved_by_ai' | 'escalated' | 'abandoned_by_caller' | 'failed_technical';
    durationSeconds: number;
    intentDetected?: string;
    sentimentScore?: number;
    escalationReason?: string;
  }): Promise<void> {
    this.logger.log(
      `[cerebro] call_ended callId=${input.callId} outcome=${input.outcome} ` +
      `duration=${input.durationSeconds}s intent=${input.intentDetected ?? 'none'}`,
    );
    // TODO Fase 4: publicar inmediato si outcome=escalated o sentiment<-0.5.
  }

  /**
   * Patrón sospechoso (mismo número llama N+ veces en T min).
   * Evento INMEDIATO — no espera al cron. Mycortex puede proponer block
   * via Twilio o alertar a ops.
   */
  async publishSuspiciousPattern(input: {
    runId: string;
    from: string;
    callsInWindow: number;
    windowSeconds: number;
  }): Promise<void> {
    this.logger.warn(
      `[cerebro] suspicious_call_pattern from=${input.from} ${input.callsInWindow} calls/${input.windowSeconds}s`,
    );

    if (!this.enabled) return;

    // Publish inmediato como AgentRunEvent con anomaly + actionProposed.
    const now = new Date();
    const event: AgentRunEvent = {
      agentId:     'voice-call-service' as any, // ver TODO en cerebro-contracts
      runId:       input.runId,
      startedAt:   now.toISOString(),
      finishedAt:  now.toISOString(),
      durationMs:  0,
      status:      'success',
      metrics:     {
        suspiciousFrom: input.from,
        callsInWindow:  input.callsInWindow,
        windowSeconds:  input.windowSeconds,
      },
      anomalies: [{
        type:     'suspicious_call_pattern',
        severity: 'warning',
        message:  `${input.from} hizo ${input.callsInWindow} llamadas en ${input.windowSeconds / 60}min — posible spam/fraud`,
        data:     { from: input.from, count: input.callsInWindow },
      }],
      actionsTaken:    [],
      actionsProposed: [{
        type:    'block_caller_temporarily',
        target:  input.from,
        reason:  `${input.callsInWindow} calls en ${input.windowSeconds / 60}min excede threshold`,
        urgency: 0.7,
        data:    { from: input.from, recommendedBlockMinutes: 60 },
      }],
      meta: { runEnv: 'production' },
    };

    try {
      await publishAgentRunEvent(event, { projectId: this.projectId });
    } catch (err) {
      this.logger.error(`[cerebro] publishSuspiciousPattern fallo: ${(err as Error).message}`);
    }
  }

  // ── Snapshot batch cada 10 min (TODO: activar @Cron cuando hagamos deploy) ──

  /**
   * Snapshot agregado de las últimas N horas. Patrón idéntico al de
   * customer-support: calcular métricas, derivar anomalies + actionsProposed,
   * publicar al topic agent.voice-call.events.
   *
   * NOTA: @Cron decorator no activado en este scaffold para evitar publish
   * accidental antes del deploy real (cuando se decida adquirir Twilio +
   * habilitar el feature). Cuando se active, ScheduleModule.forRoot() debe
   * estar en app.module (mismo patrón que booking-service y orchestrator).
   */
  async publishSnapshot(): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('[cerebro] snapshot skipped — CEREBRO_PUBLISH_ENABLED != true');
      return;
    }

    const startedAt = new Date();
    const runId = uuidv4();

    try {
      const outcomeStats = await this.repo.statsByOutcome(24);
      const activeCalls = await this.repo.listActive(100);

      const totalLast24h = Object.values(outcomeStats).reduce((s, n) => s + n, 0);
      const abandonRate = totalLast24h > 0
        ? (outcomeStats['abandoned_by_caller'] ?? 0) / totalLast24h
        : 0;
      const escalationRate = totalLast24h > 0
        ? (outcomeStats['escalated'] ?? 0) / totalLast24h
        : 0;

      const anomalies: Anomaly[] = [];
      const proposed: ActionProposed[] = [];

      // Threshold de salud: si >30% abandono o >40% escalación, anomalía.
      if (abandonRate > 0.3 && totalLast24h >= 10) {
        anomalies.push({
          type:     'high_call_abandon_rate',
          severity: 'warning',
          message:  `${(abandonRate * 100).toFixed(1)}% abandono en últimas 24h (${outcomeStats['abandoned_by_caller']}/${totalLast24h}) — AI muy lenta o respuestas mal calibradas`,
          data:     { rate: abandonRate, sample: totalLast24h },
        });
        proposed.push({
          type:    'review_voice_agent_prompts',
          reason:  `Abandono ${(abandonRate * 100).toFixed(1)}% supera 30% threshold`,
          urgency: 0.6,
          data:    { abandonRate, sample: totalLast24h },
        });
      }
      if (escalationRate > 0.4 && totalLast24h >= 10) {
        anomalies.push({
          type:     'high_call_escalation_rate',
          severity: 'info',
          message:  `${(escalationRate * 100).toFixed(1)}% escalación a humano — posibles temas que el AI no resuelve`,
          data:     { rate: escalationRate, sample: totalLast24h },
        });
      }

      const finishedAt = new Date();
      const event: AgentRunEvent = {
        agentId:    'voice-call-service' as any,
        runId,
        startedAt:  startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        status:     'success',
        metrics: {
          totalCallsLast24h:    totalLast24h,
          activeCalls:          activeCalls.length,
          abandonRate:          Math.round(abandonRate * 100) / 100,
          escalationRate:       Math.round(escalationRate * 100) / 100,
          resolvedByAi:         outcomeStats['resolved_by_ai'] ?? 0,
          escalated:            outcomeStats['escalated'] ?? 0,
          abandoned:            outcomeStats['abandoned_by_caller'] ?? 0,
          failed:               outcomeStats['failed_technical'] ?? 0,
        },
        anomalies,
        actionsTaken:    [],
        actionsProposed: proposed,
        meta: { runEnv: 'production' },
      };

      await publishAgentRunEvent(event, { projectId: this.projectId });
      this.logger.log(`[cerebro] snapshot publicado runId=${runId.slice(0, 8)} totalCalls24h=${totalLast24h}`);
    } catch (err) {
      this.logger.error(`[cerebro] publishSnapshot fallo: ${(err as Error).message}`);
    }
  }
}
