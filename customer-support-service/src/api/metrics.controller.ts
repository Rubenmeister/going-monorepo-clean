import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from '../infrastructure/metrics.service';
import { MongoConversationRepository } from '../infrastructure/persistence/mongo-conversation.repository';
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
  constructor(
    private readonly metrics: MetricsService,
    private readonly convRepo: MongoConversationRepository,
  ) {}

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

  /**
   * GET /support/metrics/pending-red-handoffs?olderThanH=24
   *
   * Cerebro Fase B — métrica observable para ActionVerifier del
   * orchestrator. Cuenta handoffs RED sin operador asignado más viejos
   * que N horas. La acción `cleanup_stale_customer_handoffs` debería
   * reducirla a 0 (o ≤1) tras ejecutar.
   *
   * Auth: admin JWT O X-Internal-Token. El orchestrator usa el segundo.
   */
  @Get('metrics/pending-red-handoffs')
  @UseGuards(AdminOrInternalGuard)
  async getPendingRedHandoffs(
    @Query('olderThanH') olderThanH?: string,
  ): Promise<{ count: number; olderThanH: number; asOf: string }> {
    const h = parseInt(olderThanH || '24', 10);
    const safeH = Number.isFinite(h) && h > 0 && h <= 720 ? h : 24;
    const count = await this.convRepo.countRedHandoffsOlderThan(safeH);
    return {
      count,
      olderThanH: safeH,
      asOf: new Date().toISOString(),
    };
  }
}
