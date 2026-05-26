/**
 * Builders puros usados por BookingOptionsScreen para construir los
 * params de navegación. Extraídos a un módulo separado para que sean
 * testeable sin tener que renderizar el componente.
 */
import type {
  OnDemandOption,
  ScheduledOption,
  AlternativeSchedule,
} from '../../services/api';
import type { ConfirmRideParams } from './ConfirmRideScreen';
import type { ScheduledSeatReservationParams } from './ScheduledSeatReservationScreen';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Builder de params de ConfirmRide desde una opción on-demand del /search.
 * type='privado' porque on-demand = vehículo dedicado (ride-hailing).
 * `departureTime` = now + estimatedEtaMinutes — para que ConfirmRide muestre
 * la hora estimada al usuario.
 */
export function buildConfirmRideFromOnDemand(
  opt: OnDemandOption,
  pickup: LocationPoint,
  destination: LocationPoint,
  now: Date = new Date(),
): ConfirmRideParams {
  const eta = new Date(now.getTime() + opt.estimatedEtaMinutes * 60_000);
  return {
    type:          'privado',
    origin:        pickup.address ?? 'Origen',
    originCoords:  { lat: pickup.latitude, lng: pickup.longitude },
    destination:   destination.address ?? 'Destino',
    destCoords:    { lat: destination.latitude, lng: destination.longitude },
    departureTime: eta.toISOString(),
    vehicle:       opt.vehicleType ?? opt.label,
    vehicleId:     opt.vehicleType,
    totalPrice:    opt.price,
  };
}

/**
 * Builder de params de ScheduledSeatReservationScreen desde una opción
 * scheduled (o alternativeSchedule) del /search.
 */
export function buildSeatReservationParams(
  opt: ScheduledOption | AlternativeSchedule,
  pickup: LocationPoint,
  destination: LocationPoint,
): ScheduledSeatReservationParams {
  return {
    scheduledTripId: opt.scheduledTripId,
    originCity:      opt.originCity,
    destCity:        opt.destCity,
    routeLabel:      opt.routeLabel,
    pickup:          pickup,
    destination:     destination,
    departureTime:   opt.departureTime,
    availableSeats:  opt.availableSeats,
    pricePerSeat:    opt.pricePerSeat,
    vehicleModel:    opt.vehicleModel,
    driver:          opt.driver,
  };
}
