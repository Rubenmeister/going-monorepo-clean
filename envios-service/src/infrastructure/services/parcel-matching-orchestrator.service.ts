import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';
import { Inject } from '@nestjs/common';
import { CancelParcelUseCase } from '@going-monorepo-clean/domains-parcel-application';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { pushNotify } from './push-notify';
import { NearbyDriversService, RankedDriver } from './nearby-drivers.service';
import { ParcelDispatchGateway } from '../gateways/parcel-dispatch.gateway';

interface DispatchCycle {
  parcelId: string;
  attempt: number;
  totalAttempts: number;
  timer?: NodeJS.Timeout;
  cancelled: boolean;
  origin: { lat: number; lng: number; address: string };
  destination: { address: string };
  price: number;
  userId: string;
  vehicleTypes?: string[];
}

/**
 * Config por intento (radius km, minRating, wait antes del siguiente intento).
 * Mientras más intentos, más abrimos el filtro:
 *   - Radio crece: 10 → 15 → 25 km
 *   - Rating mínimo baja: 4.0 → 4.0 → 3.5
 *   - Wait antes de retry: 90s cada uno (≈4.5 min total de búsqueda)
 */
const DISPATCH_PLAN = [
  { radiusKm: 10, minRating: 4.0, waitMs: 90_000 },
  { radiusKm: 15, minRating: 4.0, waitMs: 90_000 },
  { radiusKm: 25, minRating: 3.5, waitMs: 90_000 },
] as const;

const NOTIFICATIONS_URL_DEFAULT = 'http://localhost:3008';

/**
 * ParcelMatchingOrchestrator
 *
 * Orquesta el ciclo de asignación de un envío a un conductor:
 *
 *   1. Al crear el parcel, llamamos `start(parcel, ...)`.
 *   2. Buscamos conductores vía NearbyDriversService con filtros del intento.
 *   3. Broadcast push a los conductores ranqueados.
 *   4. Si alguno acepta (vía POST /parcels/:id/accept → AssignParcelUseCase),
 *      el controller llama `cancel(parcelId)` y el ciclo termina.
 *   5. Si tras `waitMs` nadie aceptó, siguiente intento con radio/rating
 *      relajados.
 *   6. Si agotamos los 3 intentos: `CancelParcelUseCase(reason='no_driver_found')`
 *      + notificación al usuario dueño del envío.
 *
 * Estado en memoria: no persistente. Si el pod muere a mitad de un ciclo,
 * el parcel queda en 'pending' sin retries (aceptable para este scope —
 * Cloud Run generalmente no mata pods en minutos, y alguien puede cancelar
 * manualmente).
 */
@Injectable()
export class ParcelMatchingOrchestrator implements OnModuleDestroy {
  private readonly logger = new Logger(ParcelMatchingOrchestrator.name);
  private readonly cycles = new Map<string, DispatchCycle>();
  private readonly notificationsUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly nearbyDrivers: NearbyDriversService,
    private readonly dispatchGateway: ParcelDispatchGateway,
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
    private readonly cancelParcelUseCase: CancelParcelUseCase,
  ) {
    this.notificationsUrl =
      this.config.get<string>('NOTIFICATIONS_SERVICE_URL') ||
      NOTIFICATIONS_URL_DEFAULT;
  }

  onModuleDestroy() {
    // Limpiar timers en shutdown graceful
    for (const [parcelId, cycle] of this.cycles.entries()) {
      if (cycle.timer) clearTimeout(cycle.timer);
      this.logger.log(`Orchestrator shutdown — parcel ${parcelId} ciclo abandonado`);
    }
    this.cycles.clear();
  }

  /**
   * Iniciar el ciclo de matching para un parcel recién creado.
   * Fire-and-forget desde el caller.
   */
  start(args: {
    parcelId: string;
    userId: string;
    origin: { lat: number; lng: number; address: string };
    destination: { address: string };
    price: number;
    vehicleTypes?: string[];
  }): void {
    // Si ya hay ciclo activo para este parcel, no duplicar.
    if (this.cycles.has(args.parcelId)) {
      this.logger.warn(`Parcel ${args.parcelId} ya tiene ciclo activo — skip`);
      return;
    }

    const cycle: DispatchCycle = {
      parcelId: args.parcelId,
      attempt: 0,
      totalAttempts: DISPATCH_PLAN.length,
      cancelled: false,
      origin: args.origin,
      destination: args.destination,
      price: args.price,
      userId: args.userId,
      vehicleTypes: args.vehicleTypes,
    };
    this.cycles.set(args.parcelId, cycle);
    this.logger.log(
      `Iniciando ciclo de matching parcel ${args.parcelId} (${DISPATCH_PLAN.length} intentos)`,
    );
    // Primer intento inmediato.
    void this.runAttempt(cycle);
  }

  /**
   * Cancelar el ciclo externo (ej: conductor aceptó vía /parcels/:id/accept).
   * Llamar después de que AssignParcelUseCase ejecute con éxito.
   */
  cancel(parcelId: string): void {
    const cycle = this.cycles.get(parcelId);
    if (!cycle) return;
    cycle.cancelled = true;
    if (cycle.timer) clearTimeout(cycle.timer);
    this.cycles.delete(parcelId);
    this.logger.log(
      `Ciclo de parcel ${parcelId} cancelado (conductor aceptó en intento ${cycle.attempt})`,
    );
  }

  /**
   * Ejecuta un intento: busca drivers, dispatcha notificaciones y programa
   * el siguiente intento o fallback.
   */
  private async runAttempt(cycle: DispatchCycle): Promise<void> {
    if (cycle.cancelled) return;

    // Verificar que el parcel siga pending — si ya lo aceptaron en race, salir.
    const findRes = await this.parcelRepo.findById(cycle.parcelId as UUID);
    if (findRes.isOk() && findRes.value) {
      const status = findRes.value.status;
      if (status !== 'pending') {
        this.logger.log(
          `Parcel ${cycle.parcelId} ya no está pending (status=${status}) — fin del ciclo`,
        );
        this.cycles.delete(cycle.parcelId);
        return;
      }
    }

    const plan = DISPATCH_PLAN[cycle.attempt];
    if (!plan) {
      // No debería llegar aquí — el fallback ya debería haber disparado.
      return;
    }

    this.logger.log(
      `Parcel ${cycle.parcelId} — intento ${cycle.attempt + 1}/${cycle.totalAttempts} (radius=${plan.radiusKm}km, minRating=${plan.minRating})`,
    );

    // Buscar conductores ranqueados.
    const drivers: RankedDriver[] = await this.nearbyDrivers.findRankedDrivers(
      cycle.origin.lat,
      cycle.origin.lng,
      {
        radiusKm: plan.radiusKm,
        minRating: plan.minRating,
        vehicleTypes: cycle.vehicleTypes,
        maxResults: 10,
      },
    );

    if (drivers.length > 0) {
      // Broadcast: fire-and-forget.
      void this.dispatchGateway.broadcastParcelToRankedDrivers(
        cycle.parcelId,
        drivers,
        {
          originAddress: cycle.origin.address,
          destinationAddress: cycle.destination.address,
          price: cycle.price,
          attempt: cycle.attempt + 1,
        },
      );
    } else {
      this.logger.warn(
        `Parcel ${cycle.parcelId} intento ${cycle.attempt + 1}: 0 conductores matched (radius=${plan.radiusKm}km)`,
      );
    }

    cycle.attempt += 1;

    if (cycle.attempt >= cycle.totalAttempts) {
      // Agotamos intentos: programar el fallback tras el último waitMs.
      cycle.timer = setTimeout(
        () => void this.runFallback(cycle),
        plan.waitMs,
      );
    } else {
      // Programar siguiente intento.
      cycle.timer = setTimeout(
        () => void this.runAttempt(cycle),
        plan.waitMs,
      );
    }
  }

  /**
   * Fallback: agotamos todos los intentos sin que ningún conductor acepte.
   * Cancelar el parcel + notificar al usuario dueño.
   */
  private async runFallback(cycle: DispatchCycle): Promise<void> {
    if (cycle.cancelled) return;
    this.cycles.delete(cycle.parcelId);

    try {
      // Re-verificar: podría haberse aceptado in extremis.
      const findRes = await this.parcelRepo.findById(cycle.parcelId as UUID);
      if (findRes.isOk() && findRes.value && findRes.value.status !== 'pending') {
        this.logger.log(
          `Fallback skip — parcel ${cycle.parcelId} ya fue tomado (status=${findRes.value.status})`,
        );
        return;
      }

      // Cancelar el parcel con razón 'no_driver_found'.
      await this.cancelParcelUseCase.execute(
        cycle.parcelId as UUID,
        'no_driver_found',
      );

      this.logger.warn(
        `Parcel ${cycle.parcelId} cancelado automáticamente — 0 conductores aceptaron tras ${cycle.totalAttempts} intentos`,
      );

      // Notificar al usuario.
      void this.notifyUserNoDriverFound(cycle);
    } catch (e) {
      this.logger.error(
        `Error en fallback parcel ${cycle.parcelId}: ${(e as Error).message}`,
      );
    }
  }

  private async notifyUserNoDriverFound(cycle: DispatchCycle): Promise<void> {
    // Antes pegaba a /notifications/push (ruta inexistente) sin auth → 404.
    // Ahora usa el canal S2S correcto (/notifications/send + JWT system).
    await pushNotify({
      userId: cycle.userId,
      title: 'Sin conductor disponible',
      body:
        `No encontramos un conductor para tu envío de ${cycle.origin.address} ` +
        `a ${cycle.destination.address}. Puedes reintentar más tarde.`,
    });
  }
}
