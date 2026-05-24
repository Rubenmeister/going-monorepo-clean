import { Injectable, Logger } from '@nestjs/common';
import { AgentOverrideRepository } from '../infrastructure/persistence/agent-override.repository';
import { AgentOverrideEntity } from '../infrastructure/schemas/agent-override.schema';

/**
 * AgentOverrideService — wrapper con cache para chequeos del dispatcher.
 *
 * El dispatcher llama isPaused() en CADA decisión. Sin cache eso es un
 * query a Mongo cada vez — barato pero innecesario porque overrides
 * cambian con muy poca frecuencia (ops los toca a mano cuando hay
 * incidente). Cache TTL corto (30s) balancea:
 *   - Latencia: dispatch no espera I/O al chequeo.
 *   - Reactividad: si pauso desde la UI, el efecto entra en ≤30s. Para
 *     incidentes en curso eso es aceptable; para emergencias inmediatas
 *     queda el kill-switch gcloud (ORCHESTRATOR_EXECUTE_ENABLED=false).
 *
 * El cache se invalida MANUALMENTE en pause()/unpause() para que la UI
 * vea el cambio reflejado al instante en sus listados (sin esperar TTL).
 */
@Injectable()
export class AgentOverrideService {
  private readonly logger = new Logger(AgentOverrideService.name);
  private readonly TTL_MS = 30_000;

  /** Map<agentId, { paused: boolean; fetchedAt: number }> */
  private cache = new Map<string, { paused: boolean; fetchedAt: number }>();

  constructor(private readonly repo: AgentOverrideRepository) {}

  /**
   * ¿Este agente está pausado? Lectura caliente — usada por el dispatcher
   * antes de cada despacho. Cache 30s para evitar query a Mongo en cada
   * intent.
   */
  async isPaused(agentId: string): Promise<boolean> {
    const cached = this.cache.get(agentId);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.TTL_MS) {
      return cached.paused;
    }
    const doc = await this.repo.findByAgentId(agentId);
    const paused = doc?.paused === true;
    this.cache.set(agentId, { paused, fetchedAt: now });
    return paused;
  }

  /** Pausa un agente y invalida el cache. */
  async pause(
    agentId: string,
    pausedBy: string,
    pauseReason?: string,
  ): Promise<AgentOverrideEntity> {
    const result = await this.repo.pause(agentId, pausedBy, pauseReason);
    this.invalidate(agentId);
    return result;
  }

  /** Despausa un agente y invalida el cache. */
  async unpause(
    agentId: string,
    unpausedBy: string,
  ): Promise<AgentOverrideEntity | null> {
    const result = await this.repo.unpause(agentId, unpausedBy);
    this.invalidate(agentId);
    return result;
  }

  async listPaused(): Promise<AgentOverrideEntity[]> {
    return this.repo.listPaused();
  }

  async listAll(): Promise<AgentOverrideEntity[]> {
    return this.repo.listAll();
  }

  private invalidate(agentId: string): void {
    this.cache.delete(agentId);
  }
}
