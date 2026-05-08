import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Intención generada por MyCortex en un ciclo de razonamiento.
 *
 * Una intención NO es una acción ejecutada — es una propuesta priorizada
 * que describe "esto debería pasar". Quien ejecuta es:
 *   - Operador humano (vía Telegram) en Fase 4 v0
 *   - Orchestrator automático (cuando exista, Fase 3 + 4 v1)
 *
 * `outcome` se completa después manualmente o por feedback automático
 * (Fase 7 — learning).
 */

export type IntentionStatus =
  | 'proposed'      // recién generada, sin atender
  | 'acknowledged'  // operador la vio
  | 'executed'      // alguien (humano u Orchestrator) la aplicó
  | 'rejected'      // operador la descartó
  | 'expired';      // se venció antes de que se actuara

export type IntentionOutcome =
  | 'unknown'          // no sabemos si funcionó
  | 'effective'        // resolvió el problema que predijo
  | 'partial'          // ayudó pero no fue suficiente
  | 'ineffective'      // no movió la aguja
  | 'counterproductive'; // empeoró las cosas

@Schema({ collection: 'mycortex_intentions', timestamps: true })
export class IntentionEntity {
  @Prop({ required: true, unique: true, type: String })
  intentionId!: string;            // uuid v4 — único por propuesta

  @Prop({ required: true, type: String })
  cycleId!: string;                // uuid del ciclo de razonamiento que la generó

  @Prop({ required: true, index: true, type: String })
  type!: string;                   // ej. 'prevent_supply_gap', 'reduce_chargeback_risk'

  @Prop({ required: true, type: Number, min: 0, max: 1, index: true })
  urgency!: number;                // 0-1, ordenable

  @Prop({ type: String })
  target?: string;                 // zona, driverId, userId, etc.

  @Prop({ required: true, type: String })
  reason!: string;                 // razonamiento del modelo

  @Prop({ required: true, type: String })
  suggestedAction!: string;        // qué hacer concretamente

  @Prop({ type: Date, index: true })
  expiresAt?: Date;                // urgent → la intención pierde valor pasado este tiempo

  @Prop({ type: Object })
  data?: Record<string, unknown>;  // contexto extra

  // ── Trazabilidad ─────────────────────────────────────────────
  @Prop({ required: true, type: String })
  modelUsed!: string;              // ej. 'claude-sonnet-4-5'

  @Prop({ required: true, type: Number })
  worldSnapshotGeneratedAt!: number;  // timestamp ms del snapshot que se usó

  // ── Lifecycle ────────────────────────────────────────────────
  @Prop({ required: true, type: String, index: true, default: 'proposed' })
  status!: IntentionStatus;

  @Prop({ type: Date })
  acknowledgedAt?: Date;

  @Prop({ type: String })
  acknowledgedBy?: string;         // operatorId / human

  @Prop({ type: String, default: 'unknown' })
  outcome!: IntentionOutcome;

  @Prop({ type: String })
  outcomeNotes?: string;

  @Prop({ type: Date })
  outcomeRecordedAt?: Date;

  // TTL 30d. Para learning de largo plazo (Fase 7) hay que copiar a otra
  // collection antes de que expire.
  @Prop({ type: Date, default: () => new Date(), index: true, expires: '30d' })
  receivedAt!: Date;
}

export type IntentionDocument = IntentionEntity & Document;
export const IntentionSchema = SchemaFactory.createForClass(IntentionEntity);

// Para el endpoint /mycortex/intentions: por cycleId + por status.
IntentionSchema.index({ cycleId: 1, urgency: -1 });
IntentionSchema.index({ status: 1, urgency: -1 });
