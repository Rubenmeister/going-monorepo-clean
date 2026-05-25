import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IDriverHybridContextRepository,
  DriverHybridContext,
} from '@going-monorepo-clean/domains-transport-core';
import { DriverHybridLifecycleService } from '@going-monorepo-clean/domains-transport-application';

/**
 * DriverHybridTransitionCronService — dispara las dos transiciones
 * automáticas del Hybrid Mode cada minuto.
 *
 *   1. AVAILABLE_LOCAL → BLOCKED_REST
 *      Cuando restWindowStartsAt ya pasó (faltan ≤ 45 min para el retorno).
 *      Aplica el evento `rest_window_entered`.
 *
 *   2. BLOCKED_REST → LONG_TRIP_RETURN
 *      Cuando nextLongTripStartTime ya pasó (es hora del viaje de vuelta).
 *      Aplica el evento `return_started`.
 *
 * Diseño:
 *   - Toggle env `HYBRID_CRON_ENABLED` (default FALSE) para opt-in seguro.
 *     Mientras estamos validando el feature, queda apagado en prod hasta
 *     que tengamos drivers reales en modo híbrido.
 *   - Idempotente: si el cron fire dos veces dentro del mismo minuto
 *     (improbable pero posible con múltiples pods), la segunda corrida
 *     no encuentra contextos en estado origen → no-op.
 *   - Error isolation: si una transición específica falla (Mongo timeout,
 *     transición inválida por bug), se loggea y se sigue con el resto.
 *     No tira excepción.
 *   - Métricas en log structured: cada ciclo loggea el batch size +
 *     duración para que ops monitoree desde Cloud Logging.
 *
 * Concurrency:
 *   Si hay varios pods de transport-service, todos corren este cron en
 *   paralelo. La query del repo + transition + save es idempotente porque:
 *     - Pod A lee ctx en AVAILABLE_LOCAL, transita a BLOCKED_REST, save
 *     - Pod B lee la misma colección DESPUÉS del save de A: ya no está
 *       en AVAILABLE_LOCAL, query devuelve 0 → no-op
 *   Si fuera carrera exacta (mismo instante), el segundo save sobreescribe
 *   con el mismo nuevo state (BLOCKED_REST) — no rompe nada.
 */
@Injectable()
export class DriverHybridTransitionCronService {
  private readonly logger = new Logger(DriverHybridTransitionCronService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(IDriverHybridContextRepository)
    private readonly repo: IDriverHybridContextRepository,
    private readonly lifecycle: DriverHybridLifecycleService,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('HYBRID_CRON_ENABLED') === 'true';
  }

  /**
   * Cron #1: AVAILABLE_LOCAL → BLOCKED_REST cada minuto.
   *
   * Busca contextos cuya restWindowStartsAt ya pasó y los transita.
   * El driver pierde acceso a nuevas carreras locales pero NO se le
   * cancelan las que ya tiene en curso (eso lo maneja el matching
   * filtrando por canAcceptLocalRide() — la carrera activa no pasa
   * por ahí porque ya fue aceptada).
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'hybrid-rest-window' })
  async transitionRestWindow(): Promise<void> {
    if (!this.isEnabled()) return;

    const now = new Date();
    const t0 = Date.now();

    const result = await this.repo.findReadyForRestWindow(now);
    if (result.isErr()) {
      this.logger.error(
        `[rest-window] findReadyForRestWindow fallo: ${result.error.message}`,
      );
      return;
    }
    const ready = result.value;
    if (ready.length === 0) return;

    let transitioned = 0;
    let failed = 0;
    for (const ctx of ready) {
      // endLocalMode también desactiva la DriverBase temporal asociada.
      const result = await this.lifecycle.endLocalMode(ctx, {
        kind: 'rest_window_entered',
      });
      if (result.isOk()) transitioned++;
      else failed++;
    }

    this.logger.log(
      `[rest-window] ciclo ok — ready=${ready.length} transitioned=${transitioned} failed=${failed} dt=${Date.now() - t0}ms`,
    );
  }

  /**
   * Cron #2: BLOCKED_REST → LONG_TRIP_RETURN cada minuto.
   *
   * Busca contextos cuyo nextLongTripStartTime ya pasó (el viaje de
   * vuelta debió arrancar). Marca el contexto como LONG_TRIP_RETURN.
   * El cierre definitivo (LONG_TRIP_RETURN → IDLE) lo dispara el
   * complete-ride handler cuando el driver entrega al último pasajero
   * del retorno — eso vive en el flujo de rides, no en este cron.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'hybrid-return-start' })
  async transitionReturnStart(): Promise<void> {
    if (!this.isEnabled()) return;

    const now = new Date();
    const t0 = Date.now();

    const result = await this.repo.findReadyForReturn(now);
    if (result.isErr()) {
      this.logger.error(
        `[return-start] findReadyForReturn fallo: ${result.error.message}`,
      );
      return;
    }
    const ready = result.value;
    if (ready.length === 0) return;

    let transitioned = 0;
    let failed = 0;
    for (const ctx of ready) {
      const ok = await this.applyTransition(ctx, { kind: 'return_started' });
      if (ok) transitioned++;
      else failed++;
    }

    this.logger.log(
      `[return-start] ciclo ok — ready=${ready.length} transitioned=${transitioned} failed=${failed} dt=${Date.now() - t0}ms`,
    );
  }

  /**
   * Aplica una transición a un contexto y persiste. Devuelve true si
   * la transición + save fueron OK, false si cualquiera falló. Aísla
   * errores para que el cron complete los demás contextos.
   */
  private async applyTransition(
    ctx: DriverHybridContext,
    event: Parameters<DriverHybridContext['transition']>[0],
  ): Promise<boolean> {
    const transitionResult = ctx.transition(event);
    if (transitionResult.isErr()) {
      this.logger.warn(
        `transition fallo id=${ctx.id} driver=${ctx.driverId} ` +
          `fromState=${ctx.state} event=${event.kind}: ${transitionResult.error.message}`,
      );
      return false;
    }
    const newCtx = transitionResult.value;

    const saveResult = await this.repo.save(newCtx);
    if (saveResult.isErr()) {
      this.logger.error(
        `save fallo id=${newCtx.id} driver=${newCtx.driverId} ` +
          `newState=${newCtx.state}: ${saveResult.error.message}`,
      );
      return false;
    }

    this.logger.log(
      `transitioned id=${ctx.id.slice(0, 8)} driver=${ctx.driverId.slice(0, 8)} ` +
        `${ctx.state}→${newCtx.state} (${event.kind})`,
    );
    return true;
  }
}
