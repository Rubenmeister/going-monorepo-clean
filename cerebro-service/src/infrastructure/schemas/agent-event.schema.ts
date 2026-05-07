import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AgentId, AnomalySeverity, RunStatus } from '@going-platform/cerebro-contracts';

/**
 * Persistencia de los AgentRunEvent que llegan vía Pub/Sub. Indices pensados
 * para los queries que el cerebro va a hacer en Fase 2 (world model):
 *   - últimos N eventos por agente (agentId + finishedAt desc)
 *   - eventos con anomalías críticas en una ventana temporal
 *
 * TTL: 30 días. Suficiente para auditoría + debugging; el world model
 * agregado vive en `cerebro_world_snapshots` con su propio TTL.
 */
@Schema({ collection: 'cerebro_agent_events', timestamps: true })
export class AgentEventEntity {
  @Prop({ required: true, index: true })
  agentId!: AgentId;

  @Prop({ required: true, unique: true })  // unique para idempotencia (Pub/Sub at-least-once)
  runId!: string;

  @Prop({ required: true })
  startedAt!: Date;

  @Prop({ required: true, index: true })
  finishedAt!: Date;

  @Prop({ required: true })
  durationMs!: number;

  @Prop({ required: true, index: true })
  status!: RunStatus;

  @Prop({ type: Object, default: {} })
  metrics!: Record<string, number | string>;

  @Prop({ type: [Object], default: [] })
  anomalies!: Array<{
    type:     string;
    severity: AnomalySeverity;
    message:  string;
    data?:    Record<string, unknown>;
  }>;

  @Prop({ type: [Object], default: [] })
  actionsTaken!: Array<{
    type:    string;
    target?: string;
    result:  'ok' | 'failed' | 'suppressed';
    data?:   Record<string, unknown>;
  }>;

  @Prop({ type: [Object], default: [] })
  actionsProposed!: Array<{
    type:    string;
    target?: string;
    reason:  string;
    urgency?: number;
    data?:   Record<string, unknown>;
  }>;

  @Prop({ type: Object })
  meta?: { gitSha?: string; runEnv?: string };

  // ── Telemetría del lado del cerebro ─────────────────────
  // Cuándo lo recibimos nosotros (vs. finishedAt que es cuándo terminó el agente).
  // Útil para detectar lag en el bus.
  @Prop({ default: () => new Date(), index: true, expires: '30d' })
  receivedAt!: Date;
}

export type AgentEventDocument = AgentEventEntity & Document;
export const AgentEventSchema = SchemaFactory.createForClass(AgentEventEntity);

// Compound index: queries "últimos N eventos del agente X".
AgentEventSchema.index({ agentId: 1, finishedAt: -1 });
