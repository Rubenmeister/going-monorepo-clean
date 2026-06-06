import { IsNumber, Min, Max, IsOptional, IsString, IsBoolean, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request Ride DTO
 */
export class RequestRideDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  pickupLatitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  pickupLongitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  dropoffLatitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  dropoffLongitude: number;

  /**
   * Tier brand del viaje (calidad de servicio). Valores aceptados:
   *   - 'confort' (default, reemplaza el legacy 'standard')
   *   - 'premium' (gama alta, +50% multiplier)
   *   - 'empresa' (B2B corporativo, multiplier 1.0 — el +25% viene del
   *     clientSegment derivado del JWT, no de aquí; ver libs/pricing/
   *     service-tier.ts)
   *
   * Backward-compat: builds pre-v66 envían 'standard' → backend lo
   * normaliza a 'confort' vía normalizeServiceTier() de libs/pricing.
   *
   * NOTA: el RequestRideUseCase ACTUALMENTE trata este campo como vehicle
   * type (suv default), no como tier. Es deuda técnica conocida — separar
   * en `tier` (calidad) vs `vehicleType` (tamaño) está pendiente. Mientras
   * tanto el campo acepta ambos contextos.
   */
  @IsOptional()
  @IsString()
  serviceType?: string;

  /**
   * @deprecated Server-side enforcement (audit #29): el backend deriva
   * isCorporate desde `user.companyId` del JWT, ignorando este campo salvo
   * que el caller sea admin. Mantenido en el DTO solo por compatibilidad
   * con mobile builds antiguos — los nuevos NO deben enviarlo.
   */
  @IsOptional()
  @IsBoolean()
  isCorporate?: boolean;

  /**
   * Fecha/hora programada (ISO 8601). Si está presente Y es futura, el viaje
   * se crea como RESERVA: NO se busca conductor de inmediato. Un cron
   * (ScheduledRideDispatcherCron) dispara el matching MATCH_LEAD_TIME_MINUTES
   * antes de esta hora. Si está ausente o ya pasó, el flujo es inmediato
   * ("en la ciudad"): se busca al conductor activo más cercano al instante.
   *
   * ANTES: el webapp ya enviaba este campo pero el ValidationPipe
   * (whitelist:true) lo descartaba porque no estaba declarado aquí — los
   * viajes "programados" terminaban buscando conductor igual que los
   * inmediatos. Declararlo lo conecta de punta a punta.
   */
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  /**
   * Modalidad de transporte: 'private' | 'shared'. Solo informativo para el
   * matching/persistencia; el webapp lo manda como 'private'/'shared'.
   */
  @IsOptional()
  @IsString()
  mode?: string;

  /**
   * Precio fijado al momento de reservar (precio garantizado). Cuando el
   * viaje es programado, el frontend manda el total ya calculado para que la
   * reserva preserve EXACTAMENTE ese valor aunque al ejecutarse (1h antes)
   * las condiciones (hora pico, etc.) sean otras.
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  lockedFare?: number;
}

/**
 * Ride Response DTO
 */
export class RideResponseDto {
  rideId: string;
  userId: string;
  status: string;
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
  fare: {
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    surgeMultiplier: number;
    estimatedTotal: number;
  };
  requestedAt: Date;
  eta?: number; // seconds
}

/**
 * Accept Ride DTO
 */
export class AcceptRideDto {
  driverId?: string;
  @IsOptional() @IsString() driverName?:   string;
  @IsOptional() @IsString() vehicleModel?: string;
  @IsOptional() @IsString() vehiclePlate?: string;
  @IsOptional() @IsNumber()  driverRating?: number;
  @IsOptional() @IsString() driverPhoto?:  string;
  @IsOptional() @IsNumber()  etaMinutes?:   number;
}

/**
 * Start Ride DTO
 */
export class StartRideDto {
  driverId: string;
  latitude: number;
  longitude: number;
}

/**
 * Complete Ride DTO
 */
export class CompleteRideDto {
  latitude: number;
  longitude: number;
  distanceKm: number;
  durationSeconds: number;
}
