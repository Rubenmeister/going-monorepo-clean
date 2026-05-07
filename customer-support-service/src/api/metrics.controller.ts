import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from '../infrastructure/metrics.service';

/**
 * Endpoint de observabilidad para customer-support.
 *
 * Lo consume:
 *   - cerebro-service (cuando lo necesita on-demand sin esperar al cron)
 *   - admin-dashboard (vista de operaciones en /support)
 *   - smoke tests / health checks ampliados
 */
@Controller('support')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * GET /support/metrics?windowMinutes=10
   *
   * Devuelve un snapshot de métricas operacionales del agente. Default
   * window 10 min (mismo que el cron del CerebroPublisher).
   */
  @Get('metrics')
  async getMetrics(@Query('windowMinutes') windowMinutes?: string) {
    const w = parseInt(windowMinutes || '10', 10);
    const safeWindow = Number.isFinite(w) && w > 0 && w <= 1440 ? w : 10;
    return this.metrics.snapshot(safeWindow);
  }
}
