import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  IDriverBaseRepository,
  IDriverHybridContextRepository,
  DriverBase,
  DriverHybridContext,
  DriverHybridEvent,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface StartLocalModeInput {
  driverId: UUID;
  /** Slug de la ciudad destino (ej. 'santo_domingo', 'ibarra'). */
  destinationCity: string;
  /** Centro geográfico aproximado de la ciudad destino — usado como
   *  centro de la DriverBase temporal. */
  destLat: number;
  destLng: number;
  /** Trip de retorno ya programado. */
  returnScheduledTripId: UUID;
  /** Hora absoluta del retorno. */
  nextLongTripStartTime: Date;
  /** Trip outbound recién completado (para audit). */
  outboundScheduledTripId: UUID;
  /** Radio en km del área donde el driver acepta carreras locales.
   *  Default 5 km (igual que DriverBase normal). */
  localRadiusKm?: number;
  /** Override del buffer de descanso. Default 45 min (entity default). */
  restBufferMinutes?: number;
}

/**
 * DriverHybridLifecycleService — orquesta los pasos compuestos del
 * Hybrid Mode que combinan DriverBase + DriverHybridContext en una
 * transacción lógica.
 *
 * No es un "use case" puntual sino un servicio que centraliza:
 *
 *   1. startLocalMode
 *      - Crea una DriverBase temporal centrada en destinationCity
 *      - Crea (o recupera) un DriverHybridContext del driver
 *      - Transita: IDLE → LONG_TRIP_OUTBOUND → AVAILABLE_LOCAL
 *      - Persiste ambas entidades
 *      → llamado por el hook de "outbound trip completed" (futuro)
 *
 *   2. endLocalMode
 *      - Aplica el evento de transición (rest_window_entered / return_cancelled / abort)
 *      - Desactiva la DriverBase temporal asociada al contexto
 *      - Persiste el nuevo estado
 *      → llamado por el cron Fase C cuando entra el rest window
 *      → llamado por el ride-cancellation handler cuando se cancela el retorno
 *
 * Diseño:
 *   - Sin transacción Mongo distribuida (Atlas free no soporta multi-doc
 *     transactions). Orden cuidadoso: primero crear/desactivar base,
 *     luego salvar context. Si la segunda falla, la base ya está creada/
 *     desactivada — aceptable: la base extra no rompe nada (es estática
 *     hasta el próximo deactivate), y un context perdido lo replay el cron.
 *   - Best-effort logging para triage ops sin abrir Mongo Atlas.
 */
@Injectable()
export class DriverHybridLifecycleService {
  private readonly logger = new Logger(DriverHybridLifecycleService.name);

  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
    @Inject(IDriverHybridContextRepository)
    private readonly hybridRepo: IDriverHybridContextRepository,
  ) {}

  /**
   * Driver completó su intercity outbound y llegó al destino. Lo
   * habilitamos para recibir carreras locales en destinationCity
   * hasta 45 min antes del retorno.
   */
  async startLocalMode(
    input: StartLocalModeInput,
  ): Promise<Result<DriverHybridContext, Error>> {
    // Step 1: crear DriverBase temporal en destinationCity.
    const baseCreate = DriverBase.create({
      driverId: input.driverId,
      name: `Hybrid temporal — ${input.destinationCity}`,
      lat: input.destLat,
      lng: input.destLng,
      radiusKm: input.localRadiusKm ?? 5,
      isPrimary: false,
      notes:
        `Auto-creada por DriverHybridLifecycle. Outbound trip ${input.outboundScheduledTripId}. ` +
        `Se desactiva al entrar rest window (45 min antes de ${input.nextLongTripStartTime.toISOString()}).`,
    });
    if (baseCreate.isErr()) return err(baseCreate.error);
    const tempBase = baseCreate.value;

    const baseSave = await this.baseRepo.save(tempBase);
    if (baseSave.isErr()) {
      this.logger.error(
        `startLocalMode: save DriverBase fallo driver=${input.driverId}: ${baseSave.error.message}`,
      );
      return err(baseSave.error);
    }

    // Step 2: cargar o crear el DriverHybridContext del driver.
    const lookup = await this.hybridRepo.findActiveByDriverId(input.driverId);
    if (lookup.isErr()) return err(lookup.error);

    let ctx: DriverHybridContext;
    if (lookup.value) {
      // El driver ya estaba en LONG_TRIP_OUTBOUND — buen path.
      ctx = lookup.value;
    } else {
      // No hay ctx activo — creamos uno fresco en IDLE y avanzamos a
      // LONG_TRIP_OUTBOUND antes de aplicar outbound_completed. Esto cubre
      // el caso de un driver cuyo outbound se inició fuera del flujo
      // estándar (manual, retry post-restart, etc.).
      const fresh = DriverHybridContext.create({ driverId: input.driverId });
      if (fresh.isErr()) return err(fresh.error);
      const seeded = fresh.value.transition({
        kind: 'outbound_started',
        outboundScheduledTripId: input.outboundScheduledTripId,
      });
      if (seeded.isErr()) return err(seeded.error);
      ctx = seeded.value;
    }

    // Step 3: aplicar outbound_completed con la temporal base id.
    const transitioned = ctx.transition({
      kind: 'outbound_completed',
      destinationCity: input.destinationCity,
      returnScheduledTripId: input.returnScheduledTripId,
      nextLongTripStartTime: input.nextLongTripStartTime,
      temporalLocalBaseId: tempBase.id,
      restBufferMinutes: input.restBufferMinutes,
    });
    if (transitioned.isErr()) {
      this.logger.warn(
        `startLocalMode: transition outbound_completed fallo driver=${input.driverId} ` +
          `fromState=${ctx.state}: ${transitioned.error.message}`,
      );
      // Cleanup: la base temporal ya está guardada pero el ctx no transita.
      // La dejamos activa — el siguiente intento startLocalMode encontrará
      // duplicada y debería usar update (TODO en próxima iteración).
      return err(transitioned.error);
    }
    const newCtx = transitioned.value;

    const ctxSave = await this.hybridRepo.save(newCtx);
    if (ctxSave.isErr()) {
      this.logger.error(
        `startLocalMode: save hybrid ctx fallo driver=${input.driverId}: ${ctxSave.error.message}`,
      );
      return err(ctxSave.error);
    }

    this.logger.log(
      `startLocalMode driver=${input.driverId.slice(0, 8)} city=${input.destinationCity} ` +
        `→ state=${newCtx.state} tempBaseId=${tempBase.id.slice(0, 8)}`,
    );
    return ok(newCtx);
  }

  /**
   * Aplica un evento de transición que SALE de AVAILABLE_LOCAL y
   * desactiva la DriverBase temporal asociada al contexto.
   *
   * Usado por:
   *   - Cron Fase C (`rest_window_entered`)
   *   - Future ride-cancellation handler (`return_cancelled`)
   *   - Admin failsafe (`abort`)
   */
  async endLocalMode(
    ctx: DriverHybridContext,
    event: DriverHybridEvent,
  ): Promise<Result<DriverHybridContext, Error>> {
    const transitioned = ctx.transition(event);
    if (transitioned.isErr()) {
      this.logger.warn(
        `endLocalMode: transition fallo id=${ctx.id} event=${event.kind}: ${transitioned.error.message}`,
      );
      return err(transitioned.error);
    }
    const newCtx = transitioned.value;

    // Desactivar la base temporal si la había.
    if (ctx.temporalLocalBaseId) {
      const baseLookup = await this.baseRepo.findById(ctx.temporalLocalBaseId);
      if (baseLookup.isErr()) {
        // No bloqueamos — loggeamos y seguimos. La base queda activa,
        // ops puede limpiarla manualmente.
        this.logger.warn(
          `endLocalMode: lookup base ${ctx.temporalLocalBaseId} fallo: ${baseLookup.error.message}`,
        );
      } else if (baseLookup.value) {
        const deactivated = baseLookup.value.deactivate();
        const updateResult = await this.baseRepo.update(deactivated);
        if (updateResult.isErr()) {
          this.logger.warn(
            `endLocalMode: deactivate base ${ctx.temporalLocalBaseId} fallo: ${updateResult.error.message}`,
          );
        }
      }
    }

    // Salvar el contexto nuevo.
    const ctxSave = await this.hybridRepo.save(newCtx);
    if (ctxSave.isErr()) {
      this.logger.error(
        `endLocalMode: save hybrid ctx fallo id=${newCtx.id}: ${ctxSave.error.message}`,
      );
      return err(ctxSave.error);
    }

    this.logger.log(
      `endLocalMode driver=${ctx.driverId.slice(0, 8)} ${ctx.state}→${newCtx.state} (${event.kind})`,
    );
    return ok(newCtx);
  }
}
