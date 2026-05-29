import { Body, Controller, Get, HttpCode, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DecisionRepository } from '../infrastructure/persistence/decision.repository';
import { DispatcherService } from '../decision/dispatcher.service';
import { MyCortexPollerService } from '../decision/mycortex-poller.service';
import { RulesEngineService } from '../decision/rules-engine.service';
import { AgentOverrideService } from '../decision/agent-override.service';
import { OutcomeTrackerService } from '../decision/outcome-tracker.service';
import { DriftDetectorService } from '../decision/drift-detector.service';
import { DecisionStatus } from '../infrastructure/schemas/decision.schema';
import { RULES, ActionRule } from '../decision/rules-engine.service';
import { safetyMeta } from '../decision/safety-levels';

/**
 * Endpoints públicos del Orchestrator.
 *
 *  GET  /orchestrator/decisions               — histórico (filtro por status)
 *  GET  /orchestrator/decisions/:id            — una decisión específica
 *  GET  /orchestrator/pending-approvals        — Cat 3 esperando ack
 *  GET  /orchestrator/stats                    — agregadas últimas 24h
 *  GET  /orchestrator/rules                    — rules-engine config (auditoría)
 *  POST /orchestrator/poll-now                 — fuerza un poll inmediato
 *  POST /orchestrator/decisions/:id/approve    — aprueba Cat 3
 *  POST /orchestrator/decisions/:id/reject     — rechaza Cat 3
 */
@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly repo:       DecisionRepository,
    private readonly dispatcher: DispatcherService,
    private readonly poller:     MyCortexPollerService,
    private readonly rules:      RulesEngineService,
    private readonly config:     ConfigService,
    private readonly overrides:  AgentOverrideService,
    private readonly outcomes:   OutcomeTrackerService,
    private readonly drift:      DriftDetectorService,
  ) {}

  @Get('decisions')
  async listDecisions(
    @Query('limit')  limit?:  string,
    @Query('status') status?: DecisionStatus,
  ) {
    const n = parseInt(limit || '50', 10);
    const safe = Number.isFinite(n) && n > 0 && n <= 200 ? n : 50;
    const list = await this.repo.recent(safe, status);
    return { count: list.length, decisions: list };
  }

  @Get('decisions/:id')
  async getDecision(@Param('id') id: string) {
    const d = await this.repo.findById(id);
    if (!d) return { error: `decision ${id} no encontrada` };
    return d;
  }

  @Get('pending-approvals')
  async pendingApprovals() {
    const list = await this.repo.pendingApprovals();
    return { count: list.length, decisions: list };
  }

  @Get('stats')
  async stats(@Query('hours') hoursStr?: string) {
    const hours = parseInt(hoursStr || '24', 10);
    const safeHours = Number.isFinite(hours) && hours > 0 && hours <= 720 ? hours : 24;
    const stats = await this.repo.statsByStatus(safeHours);
    return { windowHours: safeHours, byStatus: stats };
  }

  /**
   * Outcome stats — métricas de convergencia de las decisiones autónomas
   * (Capa 4 mini del cerebro). Calcula success rate por verifierKey desde
   * `action_verifications`. Útil para detectar reglas que fallan mucho.
   *
   * Window default 24h. Max 720h (30 días).
   *
   * Response shape:
   *   {
   *     window: { hoursBack, since, until },
   *     total: N,
   *     byStatus: { pending_verification, converged, failed_to_converge, ... },
   *     successByKey: { pending_red_handoffs: { successRate, total, converged, failed }, ... },
   *     globalSuccessRate: 0.92,
   *     topFailedIntentTypes: [{ intentType, count }]
   *   }
   */
  @Get('outcome-stats')
  async outcomeStats(@Query('hours') hoursStr?: string) {
    const hours = parseInt(hoursStr || '24', 10);
    const safeHours = Number.isFinite(hours) && hours > 0 && hours <= 720 ? hours : 24;
    return this.outcomes.computeStats(safeHours);
  }

  /**
   * Histórico de outcome_daily_stats. Útil para dashboards de tendencia.
   * Default 30 días. Max 365.
   */
  @Get('outcome-stats/history')
  async outcomeStatsHistory(@Query('days') daysStr?: string) {
    const days = parseInt(daysStr || '30', 10);
    const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 30;
    const docs = await this.outcomes.getHistory(safeDays);
    return { days: safeDays, count: docs.length, items: docs };
  }

  /**
   * Drift report — compara success rate week-over-week por verifierKey.
   * Run on-demand del DriftDetectorService.
   * Útil para que ops vea de inmediato si alguna regla degradó.
   */
  @Get('drift-report')
  async driftReport() {
    return this.drift.detectDrift();
  }

  @Get('rules')
  rulesConfig() {
    return {
      total: Object.keys(RULES).length,
      rules: this.rules.listSupportedTypes(),
    };
  }

  /**
   * Estado runtime del orchestrator — gates de seguridad + cadencia del poller.
   * Usado por /admin/cerebro/health para mostrar de un vistazo si Cat 1/2/3
   * están activados o si el master switch está apagado.
   *
   * No expone secrets ni IDs. Solo configuración que ya está visible en
   * los logs y en el comportamiento observable del service.
   */
  @Get('status')
  status() {
    const executeRaw   = this.config.get<string>('ORCHESTRATOR_EXECUTE_ENABLED');
    const maxAutoRaw   = parseInt(this.config.get<string>('ORCHESTRATOR_MAX_AUTO_LEVEL') || '0', 10);
    const pollRaw      = this.config.get<string>('ORCHESTRATOR_POLL_ENABLED');
    const maxAutoLevel = (maxAutoRaw === 1 || maxAutoRaw === 2 || maxAutoRaw === 3) ? maxAutoRaw : 0;
    return {
      executeEnabled: executeRaw === 'true',
      maxAutoLevel,
      pollEnabled:    pollRaw !== 'false', // default true si no está seteado
      // Resumen de qué Cats están vivos en este momento:
      activeCats: executeRaw === 'true'
        ? Array.from({ length: maxAutoLevel }, (_, i) => i + 1)
        : [],
    };
  }

  @Post('poll-now')
  @HttpCode(200)
  async pollNow() {
    return this.poller.pollOnce();
  }

  @Post('decisions/:id/approve')
  @HttpCode(200)
  async approve(
    @Param('id') id: string,
    @Body() body: { approvedBy?: string },
  ) {
    const d = await this.repo.findById(id);
    if (!d) return { error: `decision ${id} no encontrada` };
    if (d.status !== 'pending_approval') {
      return { error: `decision ${id} no está en pending_approval (status=${d.status})` };
    }

    await this.repo.updateStatus(id, 'approved', {
      approvedAt: new Date(),
      approvedBy: body.approvedBy || 'unknown',
    });

    const rule: ActionRule | undefined =
      d.agentId && d.action && d.safetyLevel
        ? { agent: d.agentId, action: d.action, safetyLevel: d.safetyLevel }
        : undefined;

    if (!rule) {
      return { error: `decision ${id} sin agent/action/safetyLevel — no se puede ejecutar` };
    }

    // Ejecutar (no esperamos) y devolver. La execution es asíncrona.
    this.dispatcher.executeNow({ ...d, status: 'approved' }, rule).catch(() => {});
    return { ok: true, status: 'approved', willExecute: true };
  }

  @Post('decisions/:id/reject')
  @HttpCode(200)
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectedBy?: string; reason?: string },
  ) {
    const d = await this.repo.findById(id);
    if (!d) return { error: `decision ${id} no encontrada` };
    if (d.status !== 'pending_approval') {
      return { error: `decision ${id} no está en pending_approval (status=${d.status})` };
    }

    await this.repo.updateStatus(id, 'rejected', {
      rejectedAt: new Date(),
      rejectedBy: body.rejectedBy || 'unknown',
      rejectionReason: body.reason,
    });
    return { ok: true, status: 'rejected' };
  }

  // ── Agent overrides (kill-switch granular, task #31) ────────────────
  //
  // GET  /orchestrator/agents/overrides        — todos los overrides (auditoría)
  // GET  /orchestrator/agents/overrides/paused — solo pausados (UI hot-list)
  // POST /orchestrator/agents/:id/pause        — pausar { pausedBy, reason }
  // POST /orchestrator/agents/:id/unpause      — despausar { unpausedBy }

  /**
   * Devuelve el estado de TODOS los agentes conocidos (derivados de RULES)
   * con su flag paused + auditoría. Si un agente nunca fue tocado, devuelve
   * `paused: false` por default. La UI usa este endpoint para el toggle.
   */
  @Get('agents/overrides')
  async listOverrides() {
    const overrides = await this.overrides.listAll();
    const overrideByAgent = new Map(overrides.map((o) => [o.agentId, o]));

    // Agentes únicos derivados de RULES (los que el orchestrator puede invocar).
    const knownAgents = new Set<string>();
    for (const rule of Object.values(RULES)) {
      if (rule !== 'human_only' && typeof rule === 'object') {
        knownAgents.add(rule.agent);
      }
    }

    // Merge: lista todos los conocidos, con override si tienen uno.
    const merged = Array.from(knownAgents).sort().map((agentId) => {
      const ov = overrideByAgent.get(agentId);
      return {
        agentId,
        paused:      ov?.paused ?? false,
        pausedAt:    ov?.pausedAt,
        pausedBy:    ov?.pausedBy,
        pauseReason: ov?.pauseReason,
        unpausedAt:  ov?.unpausedAt,
        unpausedBy:  ov?.unpausedBy,
      };
    });

    return { total: merged.length, agents: merged };
  }

  /** Solo los pausados — hotlist para que la UI muestre el banner de alerta. */
  @Get('agents/overrides/paused')
  async listPaused() {
    const list = await this.overrides.listPaused();
    return { count: list.length, agents: list };
  }

  /**
   * Pausa un agente. Idempotente — re-pausar uno ya pausado solo refresca
   * pausedBy/pausedAt/reason. El dispatcher empieza a rechazar despachos
   * a este agente en ≤30s (TTL del cache).
   */
  @Post('agents/:id/pause')
  @HttpCode(200)
  async pauseAgent(
    @Param('id') agentId: string,
    @Body() body: { pausedBy?: string; reason?: string },
  ) {
    if (!agentId || agentId.length > 80) {
      throw new BadRequestException('agentId requerido (max 80 chars)');
    }
    const result = await this.overrides.pause(
      agentId,
      body.pausedBy || 'unknown',
      body.reason || '',
    );
    return {
      ok: true,
      agentId,
      paused: result.paused,
      pausedAt: result.pausedAt,
      pausedBy: result.pausedBy,
    };
  }

  /**
   * Despausa un agente. Si nunca estuvo pausado devolvemos 200 igual con
   * `wasPaused: false` — no rompemos el flujo del cliente (idempotente).
   */
  @Post('agents/:id/unpause')
  @HttpCode(200)
  async unpauseAgent(
    @Param('id') agentId: string,
    @Body() body: { unpausedBy?: string },
  ) {
    if (!agentId || agentId.length > 80) {
      throw new BadRequestException('agentId requerido (max 80 chars)');
    }
    const result = await this.overrides.unpause(
      agentId,
      body.unpausedBy || 'unknown',
    );
    return {
      ok: true,
      agentId,
      wasPaused: result !== null,
      paused: result?.paused ?? false,
      unpausedAt: result?.unpausedAt,
      unpausedBy: result?.unpausedBy,
    };
  }
}
