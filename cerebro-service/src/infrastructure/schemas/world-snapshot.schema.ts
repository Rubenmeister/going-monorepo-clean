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

/**
 * BusinessMetrics — KPIs canónicos que MyCortex razona sobre.
 *
 * Mezcla métricas TÁCTICAS (estado momento a momento) con ESTRATÉGICAS
 * (tendencias multi-día). Cada campo es opcional: si el agente que lo
 * produce no corrió todavía en la ventana del snapshot, el campo queda
 * undefined y MyCortex sabe que la data no está disponible.
 *
 * Marcadores en comentarios:
 *   ✅ Disponible — agente correspondiente computa + publica
 *   🔴 Pending — TODO data source (necesita schema extension u otro service)
 *
 * Para implementar un 🔴: ver `prompt-builder.service.ts` que tiene la
 * lista expuesta al modelo. Hasta entonces MyCortex emite human_only
 * intentions tipo "implement DAU tracking" cuando ve gap.
 */
export interface BusinessMetrics {
  // ═════════ DE OPS-AGENT ═════════

  // ── Estado momento a momento (tácticos) ───────────────────
  pendingRidesNoDriver?:   number;   // ✅
  idleDrivers?:            number;   // ✅
  activeDrivers?:          number;   // ✅ activos ahora (último ride <2h)
  dailyRidesCompleted?:    number;   // ✅ contador del día
  dailyRidesCancelled?:    number;   // ✅
  dailyGoingRevenue?:      number;   // ✅ comisiones del día (USD)

  // ── Estratégico — demanda + supply 7d/30d ────────────────
  ridesCompleted7d?:       number;   // ✅ total rides 7d
  avgRideValueUsd?:        number;   // ✅ promedio 7d (revenue / rides)
  newDriverSignups7d?:     number;   // ✅ users con role=driver creados 7d
  activeDrivers7d?:        number;   // ✅ unique drivers con ≥1 ride en 7d
  rideCompletionRate?:     number;   // ✅ completed / (completed + cancelled), 24h

  /** 🔴 Sessions únicas pasajeros 24h. Requiere session tracking (no implementado). */
  dailyActivePassengers?:  number;
  /** 🔴 MAU pasajeros. Requiere ventana 30d + session tracking. */
  monthlyActivePassengers?: number;
  /** 🔴 % usuarios que hicieron primer ride dentro de 7d de signup. Requiere users.firstRideAt o aggregation pesada sobre rides. */
  signupToFirstRideRate?:  number;
  /** 🔴 Churn mensual. Requiere ventana 30d + definir churn. */
  monthlyChurnRate?:       number;

  // ═════════ DE FINANCIAL-AGENT ═════════

  pendingPayoutsCount?:    number;   // ✅
  pendingPayoutsAmount?:   number;   // ✅
  monthlyRevenueCurrent?:  number;   // ✅ acumulado del mes
  monthlyRevenueProjected?: number;  // ✅ extrapolación lineal
  monthlyOnTrack?:         number;   // ✅ 1/0 vs meta
  weeklyRevenueUsd?:       number;   // ✅ comisiones últimos 7d (currentWeek.totalRevenue)
  weeklyRevenueChangePct?: number;   // ✅ Δ% vs semana anterior
  suspiciousDriversCount?: number;   // ✅

  /** 🔴 SRI invoices pendientes de autorización. Requiere query a Datil + filtro estado!=AUTHORIZED. */
  pendingInvoicesCount?:     number;
  /** 🔴 USD pendientes facturar SRI (rides completed sin invoiceId). Requiere extender rides query. */
  pendingInvoicesAmountUsd?: number;

  // ═════════ DE CONTENT-AGENT ═════════

  weeklyTipPublished?:     number;   // ✅
  draftsCount?:            number;   // ✅
  inReviewCount?:          number;   // ✅

  // ═════════ DE MARKETING-AGENT ═════════

  totalReach?:             number;   // ✅ alcance agregado redes
  totalEngagement?:        number;   // ✅ engagement agregado
  platformsActive?:        number;   // ✅ count plataformas reportando

  /** 🔴 % followers nuevos vs semana anterior. Requiere comparación historial. */
  weeklyFollowerGrowth?:   number;

  // ═════════ DE GOING-AGENT ═════════

  toolCallsLastCycle?:     number;   // ✅
  fixesAppliedLastCycle?:  number;   // ✅

  // ═════════ DE CUSTOMER-SUPPORT-SERVICE ═════════

  activeConversations?:        number;  // ✅
  pendingHandoffsRed?:         number;  // ✅
  pendingHandoffsOrange?:      number;  // ✅
  pendingHandoffsNormal?:      number;  // ✅
  oldestRedHandoffAgeMinutes?: number;  // ✅

  /** 🔴 Tiempo promedio entre handoff request y primera respuesta operador. Requiere captura timestamp at first reply. */
  avgHandoffResponseMin?:  number;
  /** 🔴 % handoffs cerrados dentro de 24h. Requiere ventana + resolved field. */
  handoffResolutionRate?:  number;

  // ═════════ DE NPS / LOYALTY (no implementado) ═════════

  /** 🔴 NPS score 0-100. Requiere implementar encuestas post-ride. */
  npsScore?:               number;
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
