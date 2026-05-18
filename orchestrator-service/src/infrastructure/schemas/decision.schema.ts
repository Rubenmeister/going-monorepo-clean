import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Decision representa una acción que el Orchestrator decidió tomar (o
 * proponer para aprobación) en respuesta a una intención de MyCortex.
 *
 * Lifecycle:
 *  proposed → pending_approval → approved → executing → executed
 *           ↓                  ↓
 *           rejected           expired
 *           ↓
 *           ignored (human_only)
 *
 * TTL 90 días para auditoría + Fase 7 (learning).
 */

export type DecisionStatus =
  | 'proposed'          // recién creada por el rules-engine
  | 'pending_approval'  // Cat 3 esperando ack en Telegram
  | 'approved'          // ack recibido, esperando dispatch
  | 'executing'         // dispatch en curso
  | 'executed'          // dispatch completado (ok/fail)
  | 'rejected'          // operador la rechazó manualmente
  | 'expired'           // venció antes de ack
  | 'ignored'           // human_only — Orchestrator no actuó
  | 'dormant';          // ORCHESTRATOR_EXECUTE_ENABLED=false — solo logea

export type DecisionOutcome = 'success' | 'failure' | 'unknown';

@Schema({ collection: 'orchestrator_decisions', timestamps: true })
export class DecisionEntity {
  @Prop({ required: true, unique: true, type: String })
  decisionId!: string;

  // unique:true protege contra race conditions con N instancias de Cloud Run
  // corriendo el mismo @Cron simultáneamente. La idempotencia app-level
  // (dispatcher.findByIntentionId) deja una ventana entre lookup y persist
  // donde dos instancias pueden ambas ver null y ambas crear decisión. Con
  // unique:true, la segunda inserción tira E11000 y el dispatcher captura.
  @Prop({ required: true, type: String, index: true, unique: true })
  intentionId!: string;             // de qué MyCortex intention vino

  @Prop({ required: true, type: String })
  intentionType!: string;            // ej. 'boost_driver_supply'

  @Prop({ type: Number })
  intentionUrgency?: number;         // 0-1, copiado de la intención

  // ── Acción decidida (puede ser human_only) ─────────────
  @Prop({ type: String })
  agentId?: string;                  // null si human_only

  @Prop({ type: String })
  action?: string;

  @Prop({ type: Object })
  args?: Record<string, unknown>;

  @Prop({ type: Number, enum: [1, 2, 3] })
  safetyLevel?: 1 | 2 | 3;

  // ── Lifecycle ────────────────────────────────────────────
  @Prop({ required: true, type: String, index: true, default: 'proposed' })
  status!: DecisionStatus;

  @Prop({ type: String })
  humanOnlyReason?: string;          // 'rule_configured_human_only' | 'unknown_type:...'

  /**
   * Si la decision quedó en status='dormant', acá va el motivo:
   *   - 'execute_disabled'      → ORCHESTRATOR_EXECUTE_ENABLED=false (master switch)
   *   - 'above_auto_level:N'    → safetyLevel > ORCHESTRATOR_MAX_AUTO_LEVEL (rollout gradual)
   * Útil para que admin-dashboard distinga "dormant por config" vs por nivel.
   */
  @Prop({ type: String })
  dormantReason?: string;

  @Prop({ type: Date })
  expiresAt?: Date;                  // Cat 3 ack timeout

  @Prop({ type: Date })
  approvedAt?: Date;
  @Prop({ type: String })
  approvedBy?: string;

  @Prop({ type: Date })
  rejectedAt?: Date;
  @Prop({ type: String })
  rejectedBy?: string;
  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: Date })
  executedAt?: Date;

  // ── Outcome del dispatch ─────────────────────────────────
  @Prop({ type: String, default: 'unknown' })
  outcome!: DecisionOutcome;

  @Prop({ type: Object })
  outcomeData?: Record<string, unknown>;

  @Prop({ type: String })
  errorMessage?: string;

  // TTL 90d
  @Prop({ type: Date, default: () => new Date(), index: true, expires: '90d' })
  createdReceivedAt!: Date;
}

export type DecisionDocument = DecisionEntity & Document;
export const DecisionSchema = SchemaFactory.createForClass(DecisionEntity);

// Indices compuestos para queries frecuentes:
//  - últimas N decisiones (status + createdReceivedAt desc)
//  - pending de un cierto safety level (status + safetyLevel)
DecisionSchema.index({ status: 1, createdReceivedAt: -1 });
DecisionSchema.index({ status: 1, safetyLevel: 1 });
