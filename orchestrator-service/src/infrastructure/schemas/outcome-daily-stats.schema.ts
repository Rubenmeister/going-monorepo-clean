import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Snapshot diario del OutcomeTrackerService — base para Capa 4 (Learning)
 * del cerebro autónomo.
 *
 * Persiste un row por (date YYYY-MM-DD × verifierKey). El daily cron del
 * tracker upsertea estos rows con los conteos del día. El DriftDetectorService
 * después compara week-over-week sobre estos rows.
 *
 * Por qué persistir si tenemos `action_verifications`:
 *  - action_verifications conserva el detalle (cycleId, decisionId, deltas
 *    individuales). Útil para auditoría puntual.
 *  - outcome_daily_stats es el agregado precomputed — queries de tendencia
 *    semanal/mensual son sub-segundo sin re-agregar cientos de docs.
 *  - Retention policies pueden ser distintas: action_verifications puede
 *    rotar a 90 días, outcome_daily_stats conservarse a perpetuidad (~1 KB/día).
 *
 * Índice compuesto `(date, verifierKey)` UNIQUE garantiza idempotencia del
 * upsert — si el cron corre dos veces el mismo día, sobreescribe el mismo doc.
 */
@Schema({ collection: 'outcome_daily_stats', timestamps: true })
export class OutcomeDailyStats {
  /** Fecha del snapshot en formato YYYY-MM-DD (UTC). Indexado para queries por rango. */
  @Prop({ required: true, index: true })
  date: string;

  /** Verifier key de la métrica (ej. 'pending_red_handoffs', 'active_voice_block_for_caller'). */
  @Prop({ required: true, index: true })
  verifierKey: string;

  /** Total de verifications del día para este verifierKey. */
  @Prop({ required: true })
  total: number;

  /** Verifications que convergieron (status='converged'). */
  @Prop({ required: true, default: 0 })
  converged: number;

  /** Verifications que NO convergieron (status='failed_to_converge'). */
  @Prop({ required: true, default: 0 })
  failed: number;

  /** Verifications que quedaron pending (cron expiró antes que setTimeout). */
  @Prop({ default: 0 })
  pending: number;

  /** Verifications skipped por métrica no medible (status='skipped_no_metric'). */
  @Prop({ default: 0 })
  skipped: number;

  /**
   * Success rate sobre decididas: converged / (converged + failed).
   * Sin contar pending ni skipped — esos son ruido instrumental.
   * Rango [0, 1]. NaN persistido como 0 si no hay decididas.
   */
  @Prop({ required: true })
  successRate: number;

  /** Window size en horas (típico 24 — un día). Permite distinguir snapshots
   *  de re-runs manuales que pueden tener window distinto. */
  @Prop({ required: true, default: 24 })
  windowHours: number;
}

export type OutcomeDailyStatsDocument = HydratedDocument<OutcomeDailyStats>;
export const OutcomeDailyStatsSchema = SchemaFactory.createForClass(OutcomeDailyStats);

// Índice compuesto único — el upsert respeta esta key.
OutcomeDailyStatsSchema.index({ date: 1, verifierKey: 1 }, { unique: true });
