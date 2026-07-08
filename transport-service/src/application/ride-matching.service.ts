import { Inject, Injectable, Logger } from '@nestjs/common';
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import { IRideRepository } from '../domain/ports';
import { RideDispatchGateway } from '../infrastructure/gateways/ride-dispatch.gateway';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * RideMatchingService — dispara la búsqueda de conductores para un ride y
 * notifica el resultado por WebSocket.
 *
 * Modo Ciudad / tiempo real (decisión Rubén 7-jul): la asignación va al
 * conductor MÁS CERCANO de manera inmediata. En vez de difundir a todos y que
 * gane el primero en aceptar, se OFRECE en secuencia: primero al más cercano y,
 * si no acepta en `offerTimeoutMs` (o rechaza), se pasa al siguiente más
 * cercano — hasta que alguien acepte o se agote la ventana de búsqueda.
 *
 * Extraído de RideController.requestRide para reusarse desde
 * ScheduledRideDispatcherCron (viajes reservados que llegan a su ventana de 90
 * min). Ambos usan el mismo carril de "buscar conductor cercano ahora".
 */
@Injectable()
export class RideMatchingService {
  private readonly logger = new Logger(RideMatchingService.name);

  constructor(
    private readonly matchDriversUseCase: MatchAvailableDriversUseCase,
    private readonly dispatchGateway: RideDispatchGateway,
    private readonly eventsGateway: RideEventsGateway,
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
  ) {}

  // Ventana de búsqueda PERSISTENTE. Para viajes en tiempo real (intraciudad)
  // seguimos buscando conductora o conductor hasta `searchWindowMs` (default
  // 10 min), reintentando cada `retryIntervalMs`, antes de avisar "no hay
  // disponible". Así cubrimos el caso de que un conductor se ponga en línea a
  // los pocos minutos. Configurable por env.
  private readonly searchWindowMs = Number(process.env.MATCH_SEARCH_WINDOW_MS ?? 600_000);
  private readonly retryIntervalMs = Number(process.env.MATCH_RETRY_INTERVAL_MS ?? 20_000);
  // Tiempo que cada conductor tiene para aceptar la oferta antes de pasar al
  // siguiente más cercano (oferta secuencial).
  private readonly offerTimeoutMs = Number(process.env.RIDE_OFFER_TIMEOUT_MS ?? 15_000);
  private readonly pollIntervalMs = Number(process.env.RIDE_OFFER_POLL_MS ?? 2_000);

  /**
   * Oferta secuencial por cercanía (modo Ciudad). Válvula de reversa: si en
   * producción hay que volver al broadcast-a-todos, setear
   * SEQUENTIAL_OFFER_ENABLED=false (sin redeploy).
   */
  private sequentialEnabled(): boolean {
    return process.env.SEQUENTIAL_OFFER_ENABLED !== 'false';
  }

  /**
   * Fire-and-forget: busca conductores y notifica. No bloquea al caller.
   */
  dispatchMatching(params: {
    rideId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    vehicleType: string;
    isCorporate: boolean;
  }): void {
    // Fire-and-forget: corremos la ventana de búsqueda sin bloquear al caller.
    void this.runSearchWindow(params);
  }

  /**
   * Ofrece el viaje al conductor más cercano y, si no acepta, encadena al
   * siguiente — reintentando la búsqueda hasta que alguien acepte o se agote
   * `searchWindowMs`. Si la ventana se agota sin nadie, avisa al pasajero.
   */
  private async runSearchWindow(params: {
    rideId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    vehicleType: string;
    isCorporate: boolean;
  }): Promise<void> {
    const startedAt = Date.now();
    // Conductores ya ofertados en esta ventana (para no re-ofertar al mismo
    // que ignoró antes de dar turno a los demás).
    const offered = new Set<string>();
    let attempt = 0;

    try {
    while (true) {
      attempt++;
      // Renueva el LEASE de búsqueda (#9): mientras este pod busca, el viaje no
      // se considera huérfano. Si el pod muere, el lease vence y el watchdog re-despacha.
      await this.setSearchLease(params.rideId);

      // Si el viaje dejó de necesitar conductor (aceptado/cancelado), salimos.
      const ride = await this.safeFindRide(params.rideId);
      if (ride && ride.status && ride.status !== 'requested') return;
      const rejected = new Set<string>(
        (ride?.rejectedByDriverIds ?? []).map((d: any) => String(d)),
      );

      let matches: any[] = [];
      try {
        const result = await this.matchDriversUseCase.execute({
          rideId: params.rideId,
          pickupLatitude: params.pickupLatitude,
          pickupLongitude: params.pickupLongitude,
          dropoffLatitude: params.dropoffLatitude,
          dropoffLongitude: params.dropoffLongitude,
          vehicleType: params.vehicleType,
          maxRadius: 10,
          isCorporate: params.isCorporate,
        });
        if (result.isOk()) matches = result.value.matches ?? [];
      } catch (err) {
        this.logger.warn(
          `[match] intento ${attempt} ride ${params.rideId}: ${(err as Error)?.message ?? err}`,
        );
      }

      // Reversa: broadcast a todos (comportamiento anterior) si se desactivó
      // la oferta secuencial. Gana el primero en aceptar.
      if (!this.sequentialEnabled()) {
        if (matches.length > 0) {
          await this.dispatchGateway
            .broadcastRideMatches(
              params.rideId as any,
              matches,
              matches.map((m) => m.driverId),
            )
            .catch((e) => this.logger.warn(`[match] broadcast falló: ${e?.message ?? e}`));
          return;
        }
        if (Date.now() - startedAt >= this.searchWindowMs) break;
        await new Promise((resolve) => setTimeout(resolve, this.retryIntervalMs));
        continue;
      }

      // Orden Ciudad: MÁS CERCANO primero; rating como desempate. Se descartan
      // los que rechazaron o ya recibieron oferta en esta ventana.
      const ordered = matches
        .filter(
          (m) => !rejected.has(String(m.driverId)) && !offered.has(String(m.driverId)),
        )
        .sort((a, b) => a.distance - b.distance || b.rating - a.rating);

      for (const match of ordered) {
        // Revalida antes de cada oferta (pudo aceptarse/cancelarse en el ínterin).
        const fresh = await this.safeFindRide(params.rideId);
        if (!fresh) return;
        if (fresh.status && fresh.status !== 'requested') return;

        const driverId = String(match.driverId);
        offered.add(driverId);

        // Oferta DIRIGIDA a un solo conductor (el más cercano disponible).
        await this.dispatchGateway
          .broadcastRideMatches(params.rideId as any, [match], [match.driverId])
          .catch((e) => this.logger.warn(`[match] oferta a ${driverId} falló: ${e?.message ?? e}`));

        // Avisa al pasajero que estamos contactando a la conductora/or más cercano.
        try {
          this.eventsGateway['server']?.to(`ride:${params.rideId}`).emit('ride:offering', {
            rideId: params.rideId,
            driverId,
            distanceKm: match.distance,
            eta: match.eta,
            message: 'Contactando a la conductora o el conductor más cercano…',
            timestamp: new Date().toISOString(),
          });
        } catch {
          /* best-effort */
        }

        this.logger.log(
          `[match] ride ${params.rideId} → oferta a ${driverId} ` +
            `(${match.distance?.toFixed?.(1) ?? '?'}km, ★${match.rating ?? '?'}); espera ${this.offerTimeoutMs / 1000}s`,
        );

        const outcome = await this.waitForOfferOutcome(params.rideId, driverId);
        if (outcome === 'accepted') {
          this.logger.log(`[match] ride ${params.rideId} aceptado por ${driverId}`);
          return; // AcceptRideUseCase ya notificó al pasajero
        }
        if (outcome === 'aborted') return; // cancelado o tomado por otro
        // 'timeout' | 'rejected' → siguiente más cercano
      }

      if (Date.now() - startedAt >= this.searchWindowMs) break;
      await new Promise((resolve) => setTimeout(resolve, this.retryIntervalMs));
    }

    const mins = Math.round(this.searchWindowMs / 60000);
    this.eventsGateway['server']
      ?.to(`ride:${params.rideId}`)
      .emit('ride:no_drivers_available', {
        rideId: params.rideId,
        message: `No encontramos conductora o conductor disponible tras ${mins} min de búsqueda. Intenta de nuevo en unos minutos.`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      // Limpia el lease en TODA salida normal (aceptado / sin conductor / cancelado).
      // Solo un crash del pod deja el lease sin limpiar → el watchdog lo recupera.
      await this.clearSearchLease(params.rideId);
    }
  }

  private static readonly SEARCH_LEASE_MS = 4 * 60 * 1000; // > una iteración completa

  /** Renueva el lease de búsqueda hacia el futuro (best-effort). */
  private async setSearchLease(rideId: string): Promise<void> {
    try {
      await this.rideRepo.update(rideId, {
        searchingUntil: new Date(Date.now() + RideMatchingService.SEARCH_LEASE_MS),
      });
    } catch {
      /* best-effort: el lease es una optimización de recuperación, no bloquea la búsqueda */
    }
  }

  /** Limpia el lease (búsqueda terminada normalmente → no es huérfana). */
  private async clearSearchLease(rideId: string): Promise<void> {
    try {
      await this.rideRepo.update(rideId, { searchingUntil: null });
    } catch {
      /* best-effort */
    }
  }

  /**
   * Espera hasta `offerTimeoutMs` a que el conductor ofertado acepte,
   * sondeando el estado del viaje. Devuelve:
   *   - 'accepted' si el viaje quedó asignado a ESE conductor,
   *   - 'aborted'  si se canceló o lo tomó otro (o desapareció),
   *   - 'rejected' si el conductor lo rechazó explícitamente,
   *   - 'timeout'  si no pasó nada dentro del plazo.
   */
  private async waitForOfferOutcome(
    rideId: string,
    driverId: string,
  ): Promise<'accepted' | 'aborted' | 'rejected' | 'timeout'> {
    const deadline = Date.now() + this.offerTimeoutMs;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      const ride = await this.safeFindRide(rideId);
      if (!ride) return 'aborted';
      if (ride.status === 'cancelled') return 'aborted';
      if (ride.status && ride.status !== 'requested') {
        return String(ride.driverId) === driverId ? 'accepted' : 'aborted';
      }
      const rejected = (ride.rejectedByDriverIds ?? []).map((d: any) => String(d));
      if (rejected.includes(driverId)) return 'rejected';
    }
    return 'timeout';
  }

  private async safeFindRide(rideId: string): Promise<any | null> {
    try {
      return await this.rideRepo.findById(rideId);
    } catch (e) {
      this.logger.warn(`[match] findById ${rideId} falló: ${(e as Error).message}`);
      return null;
    }
  }
}
