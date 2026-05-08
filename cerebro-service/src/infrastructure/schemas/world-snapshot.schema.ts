import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AgentId, AnomalySeverity } from '@going-platform/cerebro-contracts';

/**
 * Snapshot del estado global de Going. Lo genera WorldModelService cada
 * 10 min agregando los últimos eventos de cada agente.
 *
 * Esto es lo que MyCortex (Fase 4) va a leer para razonar sobre el sistema
 * — el snapshot le da contexto cross-agente sin tener que escarbar en cada
 * collection.
 *
 * TTL 7 días (suficiente para auditoría + comparativas hora-a-hora).
 */

export type SystemHealth = 'healthy' | 'degraded' | 'critical';

export interface PerAgentSummary {
  agentId:        AgentId;
  lastRunAt:      Date | null;
  lastStatus:     'success' | 'partial_failure' | 'failure' | 'unknown';
  ageMinutes:     number;        // cuán "fresco" es el último evento
  metrics:        Record<string, number | string>;
  anomaliesCount: number;
  criticalCount:  number;
  warningCount:   number;
  actionsTakenCount:    number;
  actionsProposedCount: number;
}

export interface ActiveAnomaly {
  agentId:    AgentId;
  type:       string;
  severity:   AnomalySeverity;
  message:    string;
  detectedAt: Date;
  data?:      Record<string, unknown>;
}

export interface ProposedAction {
  agentId:  AgentId;
  type:     string;
  reason:   string;
  urgency:  number;       // 0-1
  target?:  string;
  proposedAt: Date;
  data?:    Record<string, unknown>;
}

export interface BusinessMetrics {
  // De ops-agent
  pendingRidesNoDriver?:   number;
  idleDrivers?:            number;
  activeDrivers?:          number;
  dailyRidesCompleted?:    number;
  dailyGoingRevenue?:      number;

  // De financial-agent
  pendingPayoutsCount?:    number;
  pendingPayoutsAmount?:   number;
  monthlyRevenueCurrent?:  number;
  monthlyRevenueProjected?: number;
  monthlyOnTrack?:         number;
  suspiciousDriversCount?: number;

  // De content-agent
  weeklyTipPublished?:     number;
  draftsCount?:            number;
  inReviewCount?:          number;

  // De marketing-agent
  totalReach?:             number;
  totalEngagement?:        number;
  platformsActive?:        number;

  // De going-agent
  toolCallsLastCycle?:     number;
  fixesAppliedLastCycle?:  number;

  // De customer-support-service
  activeConversations?:        number;
  pendingHandoffsRed?:         number;
  pendingHandoffsOrange?:      number;
  pendingHandoffsNormal?:      number;
  oldestRedHandoffAgeMinutes?: number;
}

@Schema({ collection: 'cerebro_world_snapshots', timestamps: true })
export class WorldSnapshotEntity {
  // type: explícito en cada @Prop — webpack + reflect-metadata pierden la
  // inferencia para tipos union (SystemHealth) y a veces incluso para
  // primitivos. Más seguro siempre declararlo.
  @Prop({ required: true, index: true, type: Date })
  generatedAt!: Date;

  @Prop({ required: true, type: Number })
  windowMinutes!: number;        // ventana hacia atrás considerada (típico 30min)

  @Prop({ required: true, index: true, type: String })
  systemHealth!: SystemHealth;

  @Prop({ required: true, type: Number })
  totalCriticalAnomalies!: number;

  @Prop({ required: true, type: Number })
  totalWarnings!: number;

  @Prop({ type: [Object], default: [] })
  agents!: PerAgentSummary[];

  @Prop({ type: [Object], default: [] })
  activeAnomalies!: ActiveAnomaly[];      // críticas + warnings, ordenadas por severity

  @Prop({ type: [Object], default: [] })
  topProposedActions!: ProposedAction[];  // top 10 por urgency desc

  @Prop({ type: Object, default: {} })
  business!: BusinessMetrics;

  // ── Diff vs el snapshot anterior ────────────────────────────
  // Lo guardamos para auditoría sin tener que volver a calcular.
  @Prop({ type: Object })
  changedSinceLast?: {
    healthChanged:        boolean;       // pasó de healthy a degraded/critical o viceversa
    newCriticalCount:     number;        // anomalías críticas nuevas que aparecieron
    resolvedCriticalCount: number;       // anomalías críticas que ya no están
    description:          string;        // "ops-agent: nuevo no_driver_assigned, financial-agent: cleared"
  };

  @Prop({ type: Date, default: () => new Date(), index: true, expires: '7d' })
  receivedAt!: Date;
}

export type WorldSnapshotDocument = WorldSnapshotEntity & Document;
export const WorldSnapshotSchema = SchemaFactory.createForClass(WorldSnapshotEntity);

// Index para "último snapshot": queryable por generatedAt desc.
WorldSnapshotSchema.index({ generatedAt: -1 });
