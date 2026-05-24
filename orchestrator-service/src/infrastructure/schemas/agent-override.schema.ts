import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * AgentOverride — kill-switch granular por agente.
 *
 * Cuando un agente está pausado, el DispatcherService rechaza inmediatamente
 * cualquier decisión que apunte a él y la marca como dormant con
 * dormantReason='agent_paused' (sin tocar el bridge). Útil cuando:
 *  - Un agente está dando alarmas falsas y queremos cortarlo SIN tocar las
 *    rules ni el master switch (ORCHESTRATOR_EXECUTE_ENABLED).
 *  - Estamos haciendo mantenimiento/deploy de un agente específico.
 *  - Ops sospecha de un agente comprometido y necesita freezarlo desde la
 *    UI sin tener que abrir gcloud.
 *
 * Granularidad por agentId (no por action ni intentionType — para esa
 * granularidad usar RULES). 1 documento por agente.
 *
 * Lifecycle:
 *   - Crear con `paused: true` → bloquea todo a partir de pausedAt
 *   - `paused: false` → vuelve a permitir despachos (mantenemos el doc para
 *     auditoría: quién, cuándo, motivo de la última pausa)
 *
 * NO tiene TTL — los overrides son configuración persistente, no eventos.
 */
@Schema({ collection: 'orchestrator_agent_overrides', timestamps: true })
export class AgentOverrideEntity {
  @Prop({ required: true, unique: true, type: String, index: true })
  agentId!: string;

  @Prop({ required: true, type: Boolean, default: false, index: true })
  paused!: boolean;

  // ── Auditoría de la pausa actual / última ─────────────────
  @Prop({ type: Date })
  pausedAt?: Date;

  @Prop({ type: String })
  pausedBy?: string;

  @Prop({ type: String })
  pauseReason?: string;

  // ── Auditoría del último unpause ─────────────────
  @Prop({ type: Date })
  unpausedAt?: Date;

  @Prop({ type: String })
  unpausedBy?: string;
}

export type AgentOverrideDocument = AgentOverrideEntity & Document;
export const AgentOverrideSchema = SchemaFactory.createForClass(AgentOverrideEntity);
