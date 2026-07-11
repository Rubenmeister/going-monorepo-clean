import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DispatcherService } from './dispatcher.service';
import { DecisionRepository } from '../infrastructure/persistence/decision.repository';

interface MyCortexIntention {
  intentionId: string;
  type: string;
  urgency: number;
  target?: string;
  reason: string;
  suggestedAction: string;
  data?: Record<string, unknown>;
  status: string;
  expiresAt?: string;
}

/**
 * Poll periódico al endpoint /mycortex/intentions del MyCortex service.
 *
 * Estrategia simple: cada 5 min trae las intenciones más recientes y las
 * pasa al dispatcher. La idempotencia la maneja el dispatcher (no
 * reprocesa intentions ya vistas).
 *
 * Decision técnica: HTTP poll en lugar de Pub/Sub. MyCortex genera ~2
 * intenciones por hora — el polling tiene zero overhead y mantiene el
 * sistema más simple.
 */
@Injectable()
export class MyCortexPollerService {
  private readonly logger = new Logger(MyCortexPollerService.name);

  constructor(
    private readonly config:     ConfigService,
    private readonly dispatcher: DispatcherService,
    private readonly repo:       DecisionRepository,
  ) {}

  private get baseUrl(): string {
    return (
      this.config.get<string>('MYCORTEX_URL') ||
      'https://mycortex-service-780842550857.us-central1.run.app'
    ).replace(/\/$/, '');
  }

  private get pollEnabled(): boolean {
    // Poll on por default (no requiere ORCHESTRATOR_EXECUTE_ENABLED — la
    // diferencia entre poll-only-dormant vs full-execute la maneja el
    // dispatcher con su propio guard).
    return this.config.get<string>('ORCHESTRATOR_POLL_ENABLED') !== 'false';
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'orchestrator-poll-mycortex' })
  async pollScheduled(): Promise<void> {
    if (!this.pollEnabled) {
      this.logger.debug('Poll disabled (ORCHESTRATOR_POLL_ENABLED=false)');
      return;
    }
    await this.pollOnce();
  }

  /** Expone una sola pasada — útil para POST /orchestrator/poll-now. */
  async pollOnce(): Promise<{ fetched: number; processed: number; skipped: number }> {
    let fetched = 0;
    let processed = 0;
    let skipped = 0;

    try {
      // Pedimos top 30 pendientes — más que suficiente con frecuencia 5min.
      const url = `${this.baseUrl}/mycortex/intentions?limit=30`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        this.logger.error(`mycortex poll: ${res.status} ${url}`);
        return { fetched, processed, skipped };
      }

      const json = (await res.json()) as { intentions?: MyCortexIntention[] };
      const intentions = json.intentions ?? [];
      fetched = intentions.length;

      for (const intent of intentions) {
        // Idempotencia: skip si ya hay decisión para esta intentionId.
        const existing = await this.repo.findByIntentionId(intent.intentionId);
        if (existing) {
          skipped++;
          continue;
        }

        try {
          await this.dispatcher.process({
            intentionId: intent.intentionId,
            type:        intent.type,
            target:      intent.target,
            urgency:     intent.urgency,
            data:        intent.data,
          });
          processed++;
        } catch (e) {
          this.logger.error(
            `Error procesando intention ${intent.intentionId}: ${(e as Error).message}`,
          );
        }
      }

      // Cleanup: expirar approvals que ya pasaron deadline.
      const expired = await this.repo.expirePastApprovals();
      if (expired > 0) {
        this.logger.log(`Expiré ${expired} pending_approval(s) que pasaron timeout`);
      }

      this.logger.log(
        `poll completado — fetched=${fetched} processed=${processed} skipped=${skipped}`,
      );
    } catch (e) {
      this.logger.error(`poll exception: ${(e as Error).message}`);
    }

    return { fetched, processed, skipped };
  }
}
