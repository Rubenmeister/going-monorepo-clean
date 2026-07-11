import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminOrInternalGuard } from '../infrastructure/auth/jwt.guard';
import { AGENT_IDS, AgentId } from '@going-platform/cerebro-contracts';
import { AgentEventRepository } from '../infrastructure/persistence/agent-event.repository';
import { WorldSnapshotRepository } from '../infrastructure/persistence/world-snapshot.repository';
import { WorldModelService } from '../world-model/world-model.service';

/**
 * Endpoints públicos del cerebro.
 *
 * Fase 2 (actual): /state devuelve el último WorldSnapshot agregado.
 * /state/history para auditoría. /events* siguen siendo el feed crudo.
 */
@Controller('cerebro')
@UseGuards(AdminOrInternalGuard) // Bloque 3: admin JWT (panel) o X-Internal-Token (mycortex S2S)
export class CerebroController {
  constructor(
    private readonly events:    AgentEventRepository,
    private readonly snapshots: WorldSnapshotRepository,
    private readonly worldModel: WorldModelService,
  ) {}

  /**
   * GET /cerebro/state
   *
   * Devuelve el último WorldSnapshot persistido. Si todavía no se generó
   * ninguno (cold start del cerebro-service), construye uno on-demand y
   * lo devuelve sin persistirlo — para que el endpoint nunca devuelva
   * vacío durante los primeros 10 min después del deploy.
   */
  @Get('state')
  async getState() {
    const latest = await this.snapshots.latest();
    if (latest) {
      return {
        version: 'fase-2',
        ...latest,
      };
    }

    // Cold start: aún no corrió el cron del WorldModelService.
    const onDemand = await this.worldModel.buildOnDemand();
    return {
      version: 'fase-2',
      note: 'Snapshot generado on-demand (aún no hay snapshots persistidos — cron correrá pronto)',
      ...onDemand,
    };
  }

  /**
   * GET /cerebro/state/history?limit=N
   *
   * Histórico de snapshots para auditoría / dashboards / análisis temporal.
   * Útil para ver cómo evolucionó systemHealth a lo largo del día.
   */
  @Get('state/history')
  async getStateHistory(@Query('limit') limit?: string) {
    const n = parseInt(limit || '50', 10);
    const safeLimit = Number.isFinite(n) && n > 0 && n <= 500 ? n : 50;
    const history = await this.snapshots.history(safeLimit);
    return { count: history.length, snapshots: history };
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
