import { Injectable, Logger } from '@nestjs/common';
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import { RideDispatchGateway } from '../infrastructure/gateways/ride-dispatch.gateway';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * RideMatchingService — dispara la búsqueda de conductores para un ride y
 * notifica el resultado por WebSocket.
 *
 * Extraído de RideController.requestRide para que pueda reutilizarse desde
 * ScheduledRideDispatcherCron (viajes reservados que llegan a su ventana).
 * Se hizo un service inyectable y no un método del controller porque NestJS
 * no permite inyectar controllers en providers.
 */
@Injectable()
export class RideMatchingService {
  private readonly logger = new Logger(RideMatchingService.name);

  constructor(
    private readonly matchDriversUseCase: MatchAvailableDriversUseCase,
    private readonly dispatchGateway: RideDispatchGateway,
    private readonly eventsGateway: RideEventsGateway,
  ) {}

  // Ventana de búsqueda PERSISTENTE. Para viajes en tiempo real (intraciudad)
  // seguimos buscando conductora o conductor hasta `searchWindowMs` (default
  // 10 min), reintentando cada `retryIntervalMs`, antes de avisar "no hay
  // disponible". Así cubrimos el caso de que un conductor se ponga en línea a
  // los pocos minutos. Configurable por env.
  private readonly searchWindowMs = Number(process.env.MATCH_SEARCH_WINDOW_MS ?? 600_000);
  private readonly retryIntervalMs = Number(process.env.MATCH_RETRY_INTERVAL_MS ?? 20_000);

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
   * Reintenta la búsqueda de conductores hasta encontrar al menos uno o agotar
   * la ventana (`searchWindowMs`). Apenas hay matches, los difunde y termina.
   * Si la ventana se agota sin nadie, avisa al pasajero por socket.
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
    let attempt = 0;

    while (true) {
      attempt++;
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
        if (result.isOk() && result.value.matches.length > 0) {
          const driverIds = result.value.matches.map((m) => m.driverId);
          this.dispatchGateway.broadcastRideMatches(
            params.rideId,
            result.value.matches,
            driverIds,
          );
          return; // conductora/conductor encontrado — fin de la búsqueda
        }
      } catch (err) {
        this.logger.warn(
          `[match] intento ${attempt} para ride ${params.rideId} falló: ${
            (err as Error)?.message ?? err
          }`,
        );
      }

      // ¿Se agotó la ventana? Salimos del bucle y avisamos.
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
  }
}
