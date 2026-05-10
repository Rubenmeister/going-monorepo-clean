import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { IntentionRepository } from '../infrastructure/persistence/intention.repository';
import { ReasoningLoopService } from '../reasoning/reasoning-loop.service';
import { CortexConfigRepository } from '../infrastructure/persistence/cortex-config.repository';
import { CortexConfigService } from '../reasoning/cortex-config.service';
import { PromptBuilderService } from '../reasoning/prompt-builder.service';
import { MemoryRollupRepository } from '../infrastructure/persistence/memory-rollup.repository';
import { MemoryRollupService } from '../reasoning/memory-rollup.service';

/**
 * Endpoints públicos de MyCortex.
 *
 *   - GET /mycortex/intentions     → top intenciones pendientes (urgency desc)
 *   - GET /mycortex/intentions/all → últimas N (incluyendo executed/expired)
 *   - POST /mycortex/run-now       → fuerza un ciclo de razonamiento on-demand
 *
 *   - GET /mycortex/config         → config singleton (system prompt, model, etc.)
 *   - PUT /mycortex/config         → admin-dashboard guarda cambios
 *   - GET /mycortex/config/default → DEFAULT_SYSTEM_PROMPT (botón "restaurar default" en UI)
 */
@Controller('mycortex')
export class MyCortexController {
  constructor(
    private readonly repo:           IntentionRepository,
    private readonly loop:           ReasoningLoopService,
    private readonly configRepo:     CortexConfigRepository,
    private readonly configCache:    CortexConfigService,
    private readonly promptBuilder:  PromptBuilderService,
    private readonly rollupRepo:     MemoryRollupRepository,
    private readonly rollupSvc:      MemoryRollupService,
  ) {}

  @Get('intentions')
  async getPending(@Query('limit') limit?: string) {
    const n = parseInt(limit || '20', 10);
    const safe = Number.isFinite(n) && n > 0 && n <= 100 ? n : 20;
    const intentions = await this.repo.topPending(safe);
    return { count: intentions.length, intentions };
  }

  @Get('intentions/all')
  async getAll(@Query('limit') limit?: string) {
    const n = parseInt(limit || '50', 10);
    const safe = Number.isFinite(n) && n > 0 && n <= 200 ? n : 50;
    const intentions = await this.repo.recent(safe);
    return { count: intentions.length, intentions };
  }

  @Post('run-now')
  async runNow() {
    const result = await this.loop.runOnce();
    return result;
  }

  /**
   * Cierra el feedback loop con el orchestrator.
   *
   * El orchestrator llama acá después de ejecutar una decisión que vino
   * de una de nuestras intenciones — así MyCortex ve en su próximo ciclo
   * qué pasó realmente. Sin esto, MyCortex razonaría siempre en ciego.
   *
   *   PATCH /mycortex/intentions/:intentionId/outcome
   *   { outcome: 'effective'|'partial'|'ineffective'|'counterproductive'|'unknown',
   *     notes?: string,
   *     acknowledgedBy?: string }
   *
   * Idempotente: re-llamar sobrescribe (el último wins).
   */
  @Patch('intentions/:intentionId/outcome')
  @HttpCode(200)
  async recordOutcome(
    @Param('intentionId') intentionId: string,
    @Body()
    body: {
      outcome:        'effective' | 'partial' | 'ineffective' | 'counterproductive' | 'unknown';
      notes?:         string;
      acknowledgedBy?: string;
    },
  ) {
    const validOutcomes = ['effective', 'partial', 'ineffective', 'counterproductive', 'unknown'];
    if (!body?.outcome || !validOutcomes.includes(body.outcome)) {
      return { ok: false, error: `outcome inválido: ${body?.outcome}. Valid: ${validOutcomes.join(', ')}` };
    }

    const updated = await this.repo.recordOutcome(intentionId, {
      outcome:        body.outcome,
      notes:          body.notes,
      acknowledgedBy: body.acknowledgedBy,
    });

    if (!updated) {
      return { ok: false, error: `intention ${intentionId} no encontrada` };
    }
    return { ok: true, intentionId, outcome: body.outcome };
  }

  // ─── Config singleton ──────────────────────────────────────
  //
  // Read va directo al repo (no cacheado) — el admin quiere ver el estado
  // real cuando abre la página. La cache de CortexConfigService es solo
  // para el reasoning loop (que corre cada 30 min y tolera 60s de delay).

  @Get('config')
  async getConfig() {
    const doc = await this.configRepo.findOrCreate();
    return {
      _id:             doc._id,
      systemPrompt:    doc.systemPrompt ?? '',
      model:           doc.model ?? '',
      maxTokens:       doc.maxTokens ?? null,
      pollIntervalMin: doc.pollIntervalMin ?? null,
      enabled:         doc.enabled ?? true,
      updatedAt:       doc.updatedAt ?? null,
      updatedBy:       doc.updatedBy ?? null,
    };
  }

  @Get('config/default')
  getConfigDefault() {
    return { systemPrompt: this.promptBuilder.getDefaultSystemPrompt() };
  }

  /**
   * PUT semántico — el body es el patch a aplicar. Campos undefined/missing
   * NO se modifican (merge superficial). Después de guardar invalida el
   * cache para que el próximo ciclo lea valores frescos sin esperar TTL.
   *
   * No usamos JWT aquí porque el admin-dashboard ya está protegido por su
   * propio gate; el service sigue en VPC privada (nadie llama directo desde
   * fuera). Si en el futuro abrimos el endpoint, agregar guard.
   */
  @Put('config')
  @HttpCode(200)
  async updateConfig(
    @Body()
    body: {
      systemPrompt?:    string;
      model?:           string;
      maxTokens?:       number;
      pollIntervalMin?: number;
      enabled?:         boolean;
      updatedBy?:       string;
    },
  ) {
    const updated = await this.configRepo.update({
      systemPrompt:    body.systemPrompt,
      model:           body.model,
      maxTokens:       body.maxTokens,
      pollIntervalMin: body.pollIntervalMin,
      enabled:         body.enabled,
      updatedBy:       body.updatedBy ?? 'admin-dashboard',
    });
    this.configCache.invalidate();
    return {
      ok:              true,
      _id:             updated._id,
      systemPrompt:    updated.systemPrompt ?? '',
      model:           updated.model ?? '',
      maxTokens:       updated.maxTokens ?? null,
      pollIntervalMin: updated.pollIntervalMin ?? null,
      enabled:         updated.enabled ?? true,
      updatedAt:       updated.updatedAt ?? null,
      updatedBy:       updated.updatedBy ?? null,
    };
  }

  // ─── Memory rollups (Etapa D — memoria largo plazo) ─────────
  //
  // El @Cron del MemoryRollupService corre domingos 23:55 EC y genera el
  // rollup de la semana. Acá los exponemos para visualización + regenerar
  // manual.

  @Get('rollups')
  async listRollups(@Query('limit') limit?: string) {
    const n = parseInt(limit || '12', 10);
    const safe = Number.isFinite(n) && n > 0 && n <= 52 ? n : 12;
    const rollups = await this.rollupRepo.recent(safe);
    return { count: rollups.length, rollups };
  }

  /**
   * Regenera el rollup de la semana ANTERIOR (cierra el martes pasado).
   * Útil para backfill después de un downtime, o para ver el estado
   * actual sin esperar al cron del domingo.
   *
   * Si el body tiene weekStarting + weekEnding (ISO), regenera ese rango.
   */
  @Post('rollups/regenerate')
  @HttpCode(200)
  async regenerateRollup(
    @Body()
    body: {
      weekStarting?: string;
      weekEnding?:   string;
    },
  ) {
    if (body.weekStarting && body.weekEnding) {
      const start = new Date(body.weekStarting);
      const end   = new Date(body.weekEnding);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { ok: false, error: 'invalid weekStarting/weekEnding' };
      }
      const result = await this.rollupSvc.generateForWeek({
        weekStarting: start,
        weekEnding:   end,
      });
      return { ok: true, rollup: result };
    }
    // Sin args: regenera la semana actual hasta ahora (útil para preview).
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - daysFromMonday);
    start.setUTCHours(5, 0, 0, 0);
    const result = await this.rollupSvc.generateForWeek({
      weekStarting: start,
      weekEnding:   now,
    });
    return { ok: true, rollup: result };
  }
}
