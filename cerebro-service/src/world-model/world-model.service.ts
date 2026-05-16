import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AGENT_IDS, AgentId } from '@going-platform/cerebro-contracts';
import { AgentEventRepository } from '../infrastructure/persistence/agent-event.repository';
import { WorldSnapshotRepository } from '../infrastructure/persistence/world-snapshot.repository';
import {
  WorldSnapshotEntity,
  PerAgentSummary,
  ActiveAnomaly,
  ProposedAction,
  BusinessMetrics,
  SystemHealth,
} from '../infrastructure/schemas/world-snapshot.schema';
import { DiffDetectorService } from './diff-detector.service';

/**
 * Construye el world model agregando los últimos eventos de cada agente.
 *
 * Filosofía Fase 2: el cerebro razona sobre EVENTOS persistidos, no sobre
 * las DBs internas de cada servicio. Esto mantiene el cerebro desacoplado
 * y respeta encapsulación. Si un campo no aparece en el world model es
 * porque ningún agente lo está reportando.
 *
 * Ventana por defecto 30 min: cubre el cron más lento (going-agent cada 6h
 * solo aparecerá si publicó dentro de la ventana, si no `lastRunAt=null`
 * y el cerebro sabe que el agente está stale). Configurable via env.
 */
@Injectable()
export class WorldModelService {
  private readonly logger = new Logger(WorldModelService.name);

  constructor(
    private readonly events: AgentEventRepository,
    private readonly snapshots: WorldSnapshotRepository,
    private readonly diff: DiffDetectorService,
  ) {}

  private intervalCronExpression(): string {
    // Por defecto cada 10 min (alineado con el cron del customer-support
    // publisher). Override por env para flexibilidad sin redeploy.
    const min = parseInt(process.env.WORLD_MODEL_INTERVAL_MIN || '10', 10);
    if (!Number.isFinite(min) || min < 1 || min > 60) return '*/10 * * * *';
    return `*/${min} * * * *`;
  }

  // El @Cron se evalúa en bootstrap; no podemos pasarle dinámicamente la expr.
  // Usamos el helper EVERY_10_MINUTES que es lo que vamos a querer 99% del tiempo.
  // Si Ruben necesita otra frecuencia, cambiamos esta línea + redeploy.
  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'world-model-snapshot' })
  async generateSnapshot(): Promise<void> {
    try {
      const snapshot = await this.buildSnapshot();
      const previous = await this.snapshots.previous();
      const changed = previous ? this.diff.detect(previous, snapshot) : undefined;

      const saved = await this.snapshots.save({
        ...snapshot,
        changedSinceLast: changed,
      });

      this.logger.log(
        `📊 World snapshot ${saved._id} — health=${snapshot.systemHealth} ` +
          `crit=${snapshot.totalCriticalAnomalies} warn=${snapshot.totalWarnings} ` +
          `agents-with-data=${snapshot.agents.filter(a => a.lastRunAt).length}/${snapshot.agents.length}`,
      );

      if (changed?.healthChanged) {
        this.logger.warn(`⚠️ Cambio de salud detectado: ${changed.description}`);
      }
      if (changed && changed.newCriticalCount > 0) {
        this.logger.warn(`🚨 ${changed.newCriticalCount} nueva(s) anomalía(s) crítica(s)`);
      }
    } catch (err) {
      this.logger.error(`Failed to generate world snapshot: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  /**
   * Genera el snapshot a demanda — útil para el endpoint si no hay snapshot
   * persistido todavía (cold start) o para tests.
   */
  async buildOnDemand(): Promise<Omit<WorldSnapshotEntity, 'receivedAt'>> {
    return this.buildSnapshot();
  }

  // ─── Construcción del snapshot ─────────────────────────────────────────

  private async buildSnapshot(): Promise<Omit<WorldSnapshotEntity, 'receivedAt'>> {
    const generatedAt = new Date();
    const windowMinutes = parseInt(process.env.WORLD_MODEL_WINDOW_MIN || '30', 10);
    const since = new Date(generatedAt.getTime() - windowMinutes * 60 * 1000);

    // Para cada agente, buscamos su evento más reciente en la ventana.
    // recentByAgent ya devuelve ordenados por finishedAt desc.
    const perAgent: PerAgentSummary[] = [];
    const allCriticalAnoms: ActiveAnomaly[] = [];
    const allWarnings: ActiveAnomaly[] = [];
    const allProposed: ProposedAction[] = [];
    const business: BusinessMetrics = {};

    for (const agentId of AGENT_IDS) {
      const events = await this.events.recentByAgent(agentId, 1);
      const latest = events[0];

      if (!latest) {
        perAgent.push({
          agentId,
          lastRunAt:  null,
          lastStatus: 'unknown',
          ageMinutes: 0,
          metrics:    {},
          anomaliesCount:       0,
          criticalCount:        0,
          warningCount:         0,
          actionsTakenCount:    0,
          actionsProposedCount: 0,
        });
        continue;
      }

      const finishedAt = new Date(latest.finishedAt);
      const ageMinutes = Math.floor((generatedAt.getTime() - finishedAt.getTime()) / 60000);

      const critical = latest.anomalies.filter(a => a.severity === 'critical');
      const warning = latest.anomalies.filter(a => a.severity === 'warning');

      perAgent.push({
        agentId,
        lastRunAt:  finishedAt,
        lastStatus: latest.status,
        ageMinutes,
        metrics:    latest.metrics ?? {},
        anomaliesCount:       latest.anomalies.length,
        criticalCount:        critical.length,
        warningCount:         warning.length,
        actionsTakenCount:    latest.actionsTaken.length,
        actionsProposedCount: latest.actionsProposed.length,
      });

      // Solo consideramos anomalías de eventos dentro de la ventana — un
      // evento viejo (>windowMinutes) probablemente ya no es accionable.
      if (finishedAt >= since) {
        for (const a of critical) {
          allCriticalAnoms.push({
            agentId,
            type:       a.type,
            severity:   a.severity,
            message:    a.message,
            data:       a.data,
            detectedAt: finishedAt,
          });
        }
        for (const a of warning) {
          allWarnings.push({
            agentId,
            type:       a.type,
            severity:   a.severity,
            message:    a.message,
            data:       a.data,
            detectedAt: finishedAt,
          });
        }
        for (const p of latest.actionsProposed) {
          allProposed.push({
            agentId,
            type:    p.type,
            reason:  p.reason,
            urgency: p.urgency ?? 0,
            target:  p.target,
            data:    p.data,
            proposedAt: finishedAt,
          });
        }
      }

      // Mapear métricas de cada agente a campos canónicos del business model.
      this.mapAgentMetricsToBusiness(agentId, latest.metrics ?? {}, business);
    }

    // System health: critical = hay ≥1 critical anomaly o algún agente
    // que debería haber corrido hace tiempo y no lo hizo.
    // degraded = hay warnings pero ningún critical.
    // healthy = todo OK.
    const systemHealth = this.deriveHealth(perAgent, allCriticalAnoms.length, allWarnings.length);

    return {
      generatedAt,
      windowMinutes,
      systemHealth,
      totalCriticalAnomalies: allCriticalAnoms.length,
      totalWarnings:          allWarnings.length,
      agents: perAgent,
      // Críticas primero, después warnings (top 30 total para no inflar).
      activeAnomalies: [...allCriticalAnoms, ...allWarnings].slice(0, 30),
      topProposedActions: allProposed
        .sort((a, b) => b.urgency - a.urgency)
        .slice(0, 10),
      business,
    };
  }

  /**
   * Extrae métricas de cada agente y las pone en BusinessMetrics con
   * nombres canónicos. Esto le da al cerebro (y a MyCortex) un único lugar
   * donde leer "cuántos rides pendientes hay" sin tener que saber qué
   * agente lo reporta.
   */
  private mapAgentMetricsToBusiness(
    agentId: AgentId,
    metrics: Record<string, number | string>,
    business: BusinessMetrics,
  ): void {
    const num = (k: string): number | undefined => {
      const v = metrics[k];
      return typeof v === 'number' ? v : undefined;
    };

    switch (agentId) {
      case 'ops-agent':
        // Tácticos (estado del momento)
        business.pendingRidesNoDriver = num('pendingRidesNoDriver');
        business.idleDrivers          = num('idleDrivers');
        business.activeDrivers        = num('activeDrivers');
        business.dailyRidesCompleted  = num('dailyRidesCompleted');
        business.dailyRidesCancelled  = num('dailyRidesCancelled');
        business.dailyGoingRevenue    = num('dailyGoingRevenue');
        // Estratégicos 7d
        business.ridesCompleted7d     = num('ridesCompleted7d');
        business.ridesCancelled7d     = num('ridesCancelled7d');
        business.totalRevenue7d       = num('totalRevenue7d');
        business.avgRideValueUsd      = num('avgRideValueUsd');
        business.newDriverSignups7d   = num('newDriverSignups7d');
        business.activeDrivers7d      = num('activeDrivers7d');
        business.rideCompletionRate   = num('rideCompletionRate');
        break;

      case 'financial-agent':
        business.pendingPayoutsCount       = num('pendingPayoutsCount');
        business.pendingPayoutsAmount      = num('pendingPayoutsAmount');
        business.monthlyRevenueCurrent     = num('monthlyRevenueCurrent');
        business.monthlyRevenueProjected   = num('monthlyRevenueProjected');
        business.monthlyOnTrack            = num('monthlyOnTrack');
        business.weeklyRevenueUsd          = num('weeklyRevenueUsd');
        business.weeklyRevenueChangePct    = num('weeklyRevenueChangePct');
        business.suspiciousDriversCount    = num('suspiciousDriversCount');
        business.pendingInvoicesCount      = num('pendingInvoicesCount');
        business.pendingInvoicesAmountUsd  = num('pendingInvoicesAmountUsd');
        break;

      case 'content-agent':
        business.weeklyTipPublished = num('weeklyTipPublished');
        business.draftsCount        = num('draftsCount');
        business.inReviewCount      = num('inReviewCount');
        break;

      case 'marketing-agent':
        business.totalReach      = num('totalReach');
        business.totalEngagement = num('totalEngagement');
        business.platformsActive = num('platformsActive');
        break;

      case 'going-agent':
        business.toolCallsLastCycle    = num('toolCallsCount');
        // No tenemos directamente un counter de "fixes aplicados" en metrics,
        // se infiere del actionsTaken commit_fix; lo dejamos para Fase 3+.
        break;

      case 'customer-support-service':
        business.activeConversations        = num('activeConversations');
        business.pendingHandoffsRed         = num('pendingHandoffsRed');
        business.pendingHandoffsOrange      = num('pendingHandoffsOrange');
        business.pendingHandoffsNormal      = num('pendingHandoffsNormal');
        business.oldestRedHandoffAgeMinutes = num('oldestRedHandoffAgeMinutes');
        break;

      case 'mobile-agent':
        business.mobileAppsAnalyzed       = num('appsAnalyzed');
        business.mobileTotalIssues        = num('totalIssues');
        business.mobileTotalFatalIssues   = num('totalFatalIssues');
        business.mobileTotalUnhandled     = num('totalUnhandled');
        business.mobileTotalAffectedUsers = num('totalAffectedUsers');
        break;

      case 'frontend-agent':
        business.frontendProjectsAnalyzed = num('projectsAnalyzed');
        business.frontendTotalDeploys     = num('totalDeploys');
        business.frontendProdDeploys      = num('prodDeploys');
        business.frontendErrorDeploys     = num('errorDeploys');
        business.frontendReadyDeploys     = num('readyDeploys');
        break;
    }
  }

  /**
   * Reglas determinísticas de salud — deliberadamente simples. MyCortex
   * (Fase 4) razona contextual sobre el snapshot completo; aquí solo
   * marcamos el "semáforo" obvio.
   */
  private deriveHealth(
    agents: PerAgentSummary[],
    criticalCount: number,
    warningCount: number,
  ): SystemHealth {
    if (criticalCount > 0) return 'critical';

    // Si algún agente está "stale" (no publicó hace MUCHO más que su cron
    // típico) lo consideramos degraded. Un agente cron cada 30min no
    // debería tener ageMinutes >120; cada 6h no debería tener >720.
    const staleAgent = agents.find(a => {
      if (!a.lastRunAt) return false; // sin datos no es stale, es "no arrancó aún"
      // Heurística: 4x el cron típico. customer-support cron 10min → stale >40min.
      // financial 30min → stale >120min. ops 15min → stale >60min.
      // going-agent cada 6h → stale >24h.
      const staleThresholds: Record<AgentId, number> = {
        'ops-agent': 60,
        'financial-agent': 120,
        'content-agent': 60 * 24 * 8,    // semanal, lo damos por bueno mientras sea <8 días
        'marketing-agent': 60 * 24 * 8,
        'going-agent': 60 * 24,
        'customer-support-service': 40,
        'mobile-agent': 60 * 24,         // cron cada 6h → stale >24h
        'frontend-agent': 60 * 24,       // cron cada 6h → stale >24h (futuro)
      };
      return a.ageMinutes > (staleThresholds[a.agentId] ?? 120);
    });

    if (staleAgent || warningCount > 0) return 'degraded';
    return 'healthy';
  }
}
