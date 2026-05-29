import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActionVerification,
  ActionVerificationDocument,
} from '../infrastructure/schemas/action-verification.schema';
import {
  OutcomeDailyStats,
  OutcomeDailyStatsDocument,
} from '../infrastructure/schemas/outcome-daily-stats.schema';

/**
 * OutcomeTrackerService — Capa 4 mini del cerebro autónomo.
 *
 * Cada noche (03:00 UTC, baja carga) mira las verificaciones de las últimas
 * 24h y calcula:
 *
 *   · success rate (converged / total) por verifierKey
 *   · count por status (pending_verification / converged / failed_to_converge / skipped_no_metric)
 *   · top 3 intentTypes con más fallos
 *
 * Lo loguea con structured logs (event:'outcome_stats') para que Cloud Logging
 * lo indexe — base para alertas si una regla falla mucho. Endpoint GET
 * /admin/orchestrator/outcome-stats permite consulta on-demand desde admin.
 *
 * Por qué Capa 4 "mini" y no completa:
 *  - **Mini**: observación pura — no muta umbrales todavía. Solo reporta.
 *  - **Completa (futuro)**: ajustaría automáticamente `minUrgency` o `waitMs`
 *    en `AUTONOMOUS_ALLOWLIST` basado en outcomes (ej. si una regla siempre
 *    converge bien, podría bajar el `minUrgency` para captar más casos).
 *    Eso requiere mucho más cuidado (cambiar runbook = riesgo) — lo dejamos
 *    para Q3-Q4 cuando tengamos 3+ meses de data.
 *
 * Tiempo de cómputo esperado: <500ms para una semana de verifications.
 * Memory budget: pequeño, sin agregaciones distribuidas.
 */
@Injectable()
export class OutcomeTrackerService {
  private readonly logger = new Logger(OutcomeTrackerService.name);

  constructor(
    @InjectModel(ActionVerification.name)
    private readonly verifModel: Model<ActionVerificationDocument>,
    @InjectModel(OutcomeDailyStats.name)
    private readonly statsModel: Model<OutcomeDailyStatsDocument>,
  ) {}

  /**
   * Cron diario a las 03:00 UTC = 22:00 Quito (low traffic). Si el container
   * reinicia entre 02:30-03:30 perdemos el run del día — aceptable porque
   * los stats son acumulativos, no críticos en tiempo real.
   */
  @Cron('0 3 * * *', { name: 'outcome-tracker-daily', timeZone: 'UTC' })
  async dailyReport(): Promise<void> {
    this.logger.log('[outcome-tracker] starting daily report');
    try {
      const stats = await this.computeStats(24);
      this.logStructured(stats);
      // Persistir agregados — base para drift detection (Capa 4 media).
      await this.persistDailyStats(stats);
    } catch (e) {
      this.logger.error(`[outcome-tracker] daily report fallo: ${(e as Error).message}`);
    }
  }

  /**
   * Upserts un row por verifierKey en `outcome_daily_stats`. Idempotente:
   * si el cron corre dos veces el mismo día, sobreescribe el row existente.
   * Usa la fecha de cierre del window (= hoy si window=24h).
   */
  async persistDailyStats(stats: OutcomeStatsReport): Promise<number> {
    const dateStr = new Date(stats.window.until).toISOString().slice(0, 10); // YYYY-MM-DD
    let upserted = 0;
    for (const [verifierKey, s] of Object.entries(stats.successByKey)) {
      // Calcular pending/skipped sumando per-key. La función computeStats no
      // los expone separados por key — los re-derivamos rápido aquí.
      await this.statsModel.updateOne(
        { date: dateStr, verifierKey },
        {
          $set: {
            date:         dateStr,
            verifierKey,
            total:        s.total,
            converged:    s.converged,
            failed:       s.failed,
            pending:      0, // OutcomeStatsReport no lo separa per-key actualmente
            skipped:      0,
            successRate:  s.successRate,
            windowHours:  stats.window.hoursBack,
          },
        },
        { upsert: true },
      );
      upserted++;
    }
    if (upserted > 0) {
      this.logger.log(`[outcome-tracker] persisted ${upserted} daily stats for ${dateStr}`);
    }
    return upserted;
  }

  /**
   * Retorna el histórico de outcome_daily_stats para los últimos `days` días.
   * Útil para dashboards de tendencias y para el DriftDetectorService.
   * Ordenado desc por date + asc por verifierKey.
   */
  async getHistory(days: number): Promise<OutcomeDailyStatsDocument[]> {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = sinceDate.toISOString().slice(0, 10);
    return this.statsModel
      .find({ date: { $gte: sinceStr } })
      .sort({ date: -1, verifierKey: 1 })
      .lean()
      .exec() as unknown as OutcomeDailyStatsDocument[];
  }

  /**
   * Compute outcome stats sobre las últimas `hoursBack` horas. Reutilizable
   * tanto del cron como del endpoint admin on-demand.
   */
  async computeStats(hoursBack: number): Promise<OutcomeStatsReport> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Una sola query con find + agrupar en memoria. Para >10k verifications/día
    // refactorizar a aggregation pipeline. Hoy estimado <100/día — overkill agg.
    const docs = await this.verifModel
      .find({ createdAt: { $gte: since } })
      .lean()
      .exec();

    const total = docs.length;
    const byStatus: Record<string, number> = {};
    const byVerifierKey: Record<string, { total: number; converged: number; failed: number; pending: number; skipped: number }> = {};
    const failedByIntentType: Record<string, number> = {};

    for (const doc of docs) {
      // Por status
      byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1;

      // Por verifierKey
      const key = doc.verifierKey;
      if (!byVerifierKey[key]) {
        byVerifierKey[key] = { total: 0, converged: 0, failed: 0, pending: 0, skipped: 0 };
      }
      byVerifierKey[key].total++;
      if (doc.status === 'converged') byVerifierKey[key].converged++;
      else if (doc.status === 'failed_to_converge') byVerifierKey[key].failed++;
      else if (doc.status === 'pending_verification') byVerifierKey[key].pending++;
      else if (doc.status === 'skipped_no_metric') byVerifierKey[key].skipped++;

      // Top intentTypes que fallan
      if (doc.status === 'failed_to_converge') {
        failedByIntentType[doc.intentType] = (failedByIntentType[doc.intentType] ?? 0) + 1;
      }
    }

    // Top 3 intentTypes con más failures
    const topFailedIntentTypes = Object.entries(failedByIntentType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([intentType, count]) => ({ intentType, count }));

    // Success rate global y por key
    const successByKey: Record<string, { successRate: number; total: number; converged: number; failed: number }> = {};
    for (const [key, counts] of Object.entries(byVerifierKey)) {
      const decided = counts.converged + counts.failed; // excluye pending y skipped
      const successRate = decided > 0 ? counts.converged / decided : 0;
      successByKey[key] = {
        successRate: Number(successRate.toFixed(4)),
        total:       counts.total,
        converged:   counts.converged,
        failed:      counts.failed,
      };
    }

    const totalConverged = byStatus.converged ?? 0;
    const totalFailed    = byStatus.failed_to_converge ?? 0;
    const decidedTotal   = totalConverged + totalFailed;
    const globalSuccessRate = decidedTotal > 0 ? totalConverged / decidedTotal : 0;

    return {
      window: { hoursBack, since: since.toISOString(), until: new Date().toISOString() },
      total,
      byStatus,
      successByKey,
      globalSuccessRate: Number(globalSuccessRate.toFixed(4)),
      topFailedIntentTypes,
    };
  }

  /**
   * Log structured (Cloud Logging respeta JSON). Cada campo va a un label
   * indexable para alertas tipo: `event=outcome_stats AND globalSuccessRate<0.7`.
   */
  private logStructured(stats: OutcomeStatsReport): void {
    // Una línea de structured log por verifierKey + uno global.
    // Cloud Logging las parsea como JSON si el shape es válido.
    for (const [key, s] of Object.entries(stats.successByKey)) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        event:        'outcome_stats',
        verifierKey:  key,
        successRate:  s.successRate,
        total:        s.total,
        converged:    s.converged,
        failed:       s.failed,
        windowHours:  stats.window.hoursBack,
      }));
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      event:               'outcome_stats_global',
      globalSuccessRate:   stats.globalSuccessRate,
      total:               stats.total,
      byStatus:            stats.byStatus,
      topFailedIntentTypes: stats.topFailedIntentTypes,
      windowHours:         stats.window.hoursBack,
    }));

    this.logger.log(
      `[outcome-tracker] reportado: total=${stats.total} ` +
      `globalSuccessRate=${stats.globalSuccessRate} ` +
      `verifierKeys=${Object.keys(stats.successByKey).length} ` +
      `topFailed=${stats.topFailedIntentTypes.map((t) => `${t.intentType}:${t.count}`).join(',') || 'none'}`,
    );
  }
}

// ─── Types ─────────────────────────────────────────────────

export interface OutcomeStatsReport {
  window: { hoursBack: number; since: string; until: string };
  total:  number;
  byStatus: Record<string, number>;
  /** Por cada verifierKey: total + converged + failed + successRate (0-1). */
  successByKey: Record<string, {
    successRate: number;
    total:       number;
    converged:   number;
    failed:      number;
  }>;
  /** Global success rate solo sobre decididas (excluye pending/skipped). */
  globalSuccessRate: number;
  /** Top 3 intentTypes con más failures, ordenados desc. */
  topFailedIntentTypes: Array<{ intentType: string; count: number }>;
}
