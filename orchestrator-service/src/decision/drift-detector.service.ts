import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OutcomeDailyStats,
  OutcomeDailyStatsDocument,
} from '../infrastructure/schemas/outcome-daily-stats.schema';

/**
 * DriftDetectorService — Capa 4 media del cerebro autónomo.
 *
 * Cada lunes 04:00 UTC compara el success rate de la semana actual vs la
 * semana anterior por verifierKey. Si una regla bajó >`driftThresholdPp`
 * puntos porcentuales (default 15pp), genera una alerta estructurada en
 * Cloud Logging.
 *
 * Hoy solo **alerta** (Capa 4 media). Capa 4 completa (Q3) propondría
 * automáticamente ajustes a `AUTONOMOUS_ALLOWLIST` (subir minUrgency para
 * que la regla sea más selectiva). Por ahora la decisión queda en ops.
 *
 * **Por qué semanal y no diario:** el ruido día-a-día es alto (depende del
 * volumen). Comparar 7 días vs 7 días estabiliza la señal.
 *
 * **Por qué no auto-mutar todavía:** mutar `AUTONOMOUS_ALLOWLIST` cambia el
 * runbook del cerebro. Blast radius alto si nos equivocamos. Necesitamos
 * 3+ meses de baseline + framework de rollback antes de habilitar mutación.
 */
@Injectable()
export class DriftDetectorService {
  private readonly logger = new Logger(DriftDetectorService.name);

  /** Drop mínimo en pp para considerar drift. Configurable via env. */
  private readonly driftThresholdPp = parseInt(
    process.env.DRIFT_DETECTOR_THRESHOLD_PP ?? '15',
    10,
  );

  /** Mínimo de samples en la ventana current para considerar la regla.
   *  Si hubo <5 verifications, no comparamos — es ruido. */
  private readonly minSamples = parseInt(
    process.env.DRIFT_DETECTOR_MIN_SAMPLES ?? '5',
    10,
  );

  constructor(
    @InjectModel(OutcomeDailyStats.name)
    private readonly statsModel: Model<OutcomeDailyStatsDocument>,
  ) {}

  /**
   * Cron semanal lunes 04:00 UTC = 23:00 domingo Quito.
   * Outcome tracker corre a las 03:00 del lunes — corremos después para
   * incluir la data de domingo en la comparación.
   */
  @Cron('0 4 * * 1', { name: 'drift-detector-weekly', timeZone: 'UTC' })
  async weeklyDriftCheck(): Promise<void> {
    this.logger.log('[drift-detector] starting weekly drift check');
    try {
      const report = await this.detectDrift();
      this.logStructured(report);
    } catch (e) {
      this.logger.error(`[drift-detector] weekly check fallo: ${(e as Error).message}`);
    }
  }

  /**
   * Detecta drift comparando 2 ventanas de 7 días cada una:
   *   - current:  últimos 7 días
   *   - baseline: 14 a 7 días atrás
   *
   * Por cada verifierKey con suficientes samples en ambas ventanas, calcula
   * la diferencia en pp. Si excede driftThresholdPp, marca como drifting.
   */
  async detectDrift(): Promise<DriftReport> {
    const currentStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const baselineStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const baselineEnd = currentStart;

    const currentStartStr = currentStart.toISOString().slice(0, 10);
    const baselineStartStr = baselineStart.toISOString().slice(0, 10);
    const baselineEndStr = baselineEnd.toISOString().slice(0, 10);

    // Una sola query, después agrupamos en memoria. Para <1000 docs (mucho
    // más de lo esperado) es sub-segundo.
    const docs = await this.statsModel
      .find({ date: { $gte: baselineStartStr } })
      .lean()
      .exec();

    // Agregar por verifierKey × window
    const byKey: Record<string, {
      currentTotal: number;
      currentDecided: number;
      currentConverged: number;
      baselineTotal: number;
      baselineDecided: number;
      baselineConverged: number;
    }> = {};

    for (const doc of docs) {
      const key = doc.verifierKey;
      if (!byKey[key]) {
        byKey[key] = {
          currentTotal: 0, currentDecided: 0, currentConverged: 0,
          baselineTotal: 0, baselineDecided: 0, baselineConverged: 0,
        };
      }
      const decided = doc.converged + doc.failed;
      if (doc.date >= currentStartStr) {
        byKey[key].currentTotal     += doc.total;
        byKey[key].currentDecided   += decided;
        byKey[key].currentConverged += doc.converged;
      } else if (doc.date >= baselineStartStr && doc.date < baselineEndStr) {
        byKey[key].baselineTotal     += doc.total;
        byKey[key].baselineDecided   += decided;
        byKey[key].baselineConverged += doc.converged;
      }
    }

    // Detectar drifts
    const drifts: DriftFinding[] = [];
    const stable: StableFinding[] = [];
    for (const [verifierKey, c] of Object.entries(byKey)) {
      // Necesitamos samples en ambas ventanas (sin baseline no podemos comparar).
      if (c.currentDecided < this.minSamples || c.baselineDecided < this.minSamples) {
        continue;
      }
      const currentRate  = c.currentConverged  / c.currentDecided;
      const baselineRate = c.baselineConverged / c.baselineDecided;
      const deltaPp = (currentRate - baselineRate) * 100;

      const finding = {
        verifierKey,
        currentRate:    Number(currentRate.toFixed(4)),
        baselineRate:   Number(baselineRate.toFixed(4)),
        deltaPp:        Number(deltaPp.toFixed(2)),
        currentSamples: c.currentDecided,
        baselineSamples: c.baselineDecided,
      };

      if (deltaPp < -this.driftThresholdPp) {
        drifts.push(finding);
      } else {
        stable.push(finding);
      }
    }

    // Ordenar drifts por severidad (más negativo primero)
    drifts.sort((a, b) => a.deltaPp - b.deltaPp);

    return {
      thresholdPp: this.driftThresholdPp,
      window: {
        baseline: { since: baselineStartStr, until: baselineEndStr },
        current:  { since: currentStartStr, until: new Date().toISOString().slice(0, 10) },
      },
      driftingCount: drifts.length,
      drifting:      drifts,
      stable,
    };
  }

  private logStructured(report: DriftReport): void {
    // Log global del reporte
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      event:        'drift_report',
      thresholdPp:  report.thresholdPp,
      driftingCount: report.driftingCount,
      window:       report.window,
    }));
    // Un log per drift detectado — facilita alertas por verifierKey
    for (const d of report.drifting) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        event:       'drift_detected',
        verifierKey: d.verifierKey,
        currentRate: d.currentRate,
        baselineRate: d.baselineRate,
        deltaPp:     d.deltaPp,
        currentSamples: d.currentSamples,
      }));
    }
    if (report.driftingCount > 0) {
      this.logger.warn(
        `[drift-detector] ${report.driftingCount} regla(s) drifting: ` +
        report.drifting.map((d) => `${d.verifierKey}(${d.deltaPp}pp)`).join(', '),
      );
    } else {
      this.logger.log(`[drift-detector] no drift detected — ${report.stable.length} stable rules`);
    }
  }
}

// ─── Types ────────────────────────────────────────────────

export interface DriftFinding {
  verifierKey:     string;
  currentRate:     number;
  baselineRate:    number;
  /** Diff en puntos porcentuales (negativo = drift). */
  deltaPp:         number;
  currentSamples:  number;
  baselineSamples: number;
}

export interface StableFinding extends DriftFinding {}

export interface DriftReport {
  thresholdPp: number;
  window: {
    baseline: { since: string; until: string };
    current:  { since: string; until: string };
  };
  driftingCount: number;
  drifting: DriftFinding[];
  stable:   StableFinding[];
}
