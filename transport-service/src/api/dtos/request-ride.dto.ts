import { IsNumber, Min, Max, IsOptional, IsString, IsBoolean } from 'class-validator';
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
