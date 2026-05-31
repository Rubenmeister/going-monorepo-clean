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
    this.matchDriversUseCase
      .execute({
        rideId: params.rideId,
        pickupLatitude: params.pickupLatitude,
        pickupLongitude: params.pickupLongitude,
        dropoffLatitude: params.dropoffLatitude,
        dropoffLongitude: params.dropoffLongitude,
        vehicleType: params.vehicleType,
        maxRadius: 10,
        isCorporate: params.isCorporate,
      })
      .then((result) => {
        if (result.isOk() && result.value.matches.length > 0) {
          const driverIds = result.value.matches.map((m) => m.driverId);
          this.dispatchGateway.broadcastRideMatches(
            params.rideId,
            result.value.matches,
            driverIds,
          );
        } else {
          // Sin conductores disponibles — notificar al pasajero por socket
          // para que la app salga del estado "buscando" y muestre mensaje.
          // Delay de 4s para dar tiempo a conectar al room ride:{rideId}.
          setTimeout(() => {
            this.eventsGateway['server']?.to(`ride:${params.rideId}`).emit('ride:no_drivers_available', {
              rideId: params.rideId,
              message: 'No hay conductores disponibles cerca en este momento. Intenta de nuevo en unos minutos.',
              timestamp: new Date().toISOString(),
            });
          }, 4000);
        }
      })
      .catch(() => {
        setTimeout(() => {
          this.eventsGateway['server']?.to(`ride:${params.rideId}`).emit('ride:no_drivers_available', {
            rideId: params.rideId,
            message: 'Ocurrió un problema buscando conductores. Intenta de nuevo.',
            timestamp: new Date().toISOString(),
          });
        }, 4000);
      });
  }
}
