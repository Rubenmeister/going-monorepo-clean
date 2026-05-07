import { Controller, Get, Param, Query } from '@nestjs/common';
import { AGENT_IDS, AgentId } from '@going-platform/cerebro-contracts';
import { AgentEventRepository } from '../infrastructure/persistence/agent-event.repository';

/**
 * Endpoints públicos del cerebro.
 *
 * Fase 1 (skeleton): /state devuelve un resumen rudimentario basado en
 * eventos crudos. Fase 2 reemplaza esto con el world model agregado.
 */
@Controller('cerebro')
export class CerebroController {
  constructor(private readonly events: AgentEventRepository) {}

  /**
   * Estado actual del cerebro — placeholder Fase 1.
   *
   * Devuelve:
   *   - últimos eventos por agente (resumen)
   *   - anomalías críticas en las últimas 24h
   *   - conteo de eventos recibidos en la ventana
   *
   * Fase 2 reemplaza con el world snapshot del WorldModelService.
   */
  @Get('state')
  async getState() {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);

    const [eventsByAgent, criticalAnoms, recent] = await Promise.all([
      this.events.countByAgentSince(since24h),
      this.events.criticalAnomaliesSince(since24h, 20),
      this.events.recentGlobal(10),
    ]);

    return {
      version: 'fase-1-placeholder',
      generatedAt: new Date().toISOString(),
      windowHours: 24,
      eventsByAgent,
      criticalAnomaliesCount: criticalAnoms.reduce(
        (s, e) => s + e.anomalies.filter(a => a.severity === 'critical').length,
        0,
      ),
      criticalAnomalies: criticalAnoms.flatMap(e =>
        e.anomalies
          .filter(a => a.severity === 'critical')
          .map(a => ({
            agentId: e.agentId,
            runId:   e.runId,
            finishedAt: e.finishedAt,
            type:    a.type,
            message: a.message,
            data:    a.data,
          })),
      ),
      recentEvents: recent.map(e => ({
        agentId:    e.agentId,
        runId:      e.runId,
        finishedAt: e.finishedAt,
        status:     e.status,
        anomaliesCount:      e.anomalies.length,
        actionsTakenCount:   e.actionsTaken.length,
        actionsProposedCount: e.actionsProposed.length,
      })),
    };
  }

  /** Eventos recientes globales para auditoría / dashboard. */
  @Get('events')
  async getEvents(@Query('limit') limit?: string) {
    const n = parseInt(limit || '50', 10);
    const safeLimit = Number.isFinite(n) && n > 0 && n <= 200 ? n : 50;
    const events = await this.events.recentGlobal(safeLimit);
    return { count: events.length, events };
  }

  /** Eventos recientes de un agente específico. */
  @Get('events/:agentId')
  async getEventsByAgent(
    @Param('agentId') agentId: string,
    @Query('limit') limit?: string,
  ) {
    if (!AGENT_IDS.includes(agentId as AgentId)) {
      return { error: `agentId desconocido: ${agentId}`, validIds: AGENT_IDS };
    }
    const n = parseInt(limit || '20', 10);
    const safeLimit = Number.isFinite(n) && n > 0 && n <= 200 ? n : 20;
    const events = await this.events.recentByAgent(agentId as AgentId, safeLimit);
    return { agentId, count: events.length, events };
  }
}
