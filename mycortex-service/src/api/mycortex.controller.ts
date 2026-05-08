import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IntentionRepository } from '../infrastructure/persistence/intention.repository';
import { ReasoningLoopService } from '../reasoning/reasoning-loop.service';

/**
 * Endpoints públicos de MyCortex.
 *
 * Fase 4 v0:
 *   - GET /mycortex/intentions     → top intenciones pendientes (urgency desc)
 *   - GET /mycortex/intentions/all → últimas N (incluyendo executed/expired)
 *   - POST /mycortex/run-now       → fuerza un ciclo de razonamiento on-demand
 *   - POST /mycortex/intentions/:id/ack → ops marca como vista/aceptada
 */
@Controller('mycortex')
export class MyCortexController {
  constructor(
    private readonly repo: IntentionRepository,
    private readonly loop: ReasoningLoopService,
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
}
