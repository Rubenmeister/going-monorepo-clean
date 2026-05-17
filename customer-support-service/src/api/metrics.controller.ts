import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from '../infrastructure/metrics.service';
import { AdminOrInternalGuard } from '../infrastructure/auth/jwt.guard';

/**
 * Endpoint de observabilidad para customer-support.
 *
 * Lo consume:
 *   - cerebro-service (S2S via X-Internal-Token → InternalServiceGuard)
 *   - admin-dashboard (admin JWT → JwtAuthGuard + AdminGuard)
 *
 * Antes era 100% público. Ahora exige al menos UNO de los dos guards.
 * NestJS evalua guards en orden; el primero que devuelva true permite el
 * acceso. Aplicamos los dos: si tenés JWT admin pasás; si tenés
 * X-Internal-Token (S2S) también pasás. El resto rebota.
 */
@Controller('support')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * GET /support/metrics?windowMinutes=10
   *
   * Devuelve un snapshot de métricas operacionales del agente. Default
   * window 10 min (mismo que el cron del CerebroPublisher).
   *
   * Auth: admin JWT O X-Internal-Token de servicios internos.
   */
  @Get('metrics')
  @UseGuards(AdminOrInternalGuard)
  async getMetrics(@Query('windowMinutes') windowMinutes?: string) {
    const w = parseInt(windowMinutes || '10', 10);
    const safeWindow = Number.isFinite(w) && w > 0 && w <= 1440 ? w : 10;
    return this.metrics.snapshot(safeWindow);
  }
}
