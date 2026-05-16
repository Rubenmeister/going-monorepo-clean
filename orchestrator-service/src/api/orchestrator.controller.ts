import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DecisionRepository } from '../infrastructure/persistence/decision.repository';
import { DispatcherService } from '../decision/dispatcher.service';
import { MyCortexPollerService } from '../decision/mycortex-poller.service';
import { RulesEngineService } from '../decision/rules-engine.service';
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
}
