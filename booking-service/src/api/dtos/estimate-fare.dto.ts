import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * EstimateFareDto — input del endpoint POST /bookings/estimate.
 *
 * Permite cotizar tarifa para los distintos serviceType que el PricingService
 * soporta. La validación es deliberadamente permisiva en algunos campos porque
 * cada serviceType usa subsets distintos (ej: envío necesita weightKg pero
 * transport no). El PricingService valida shape interno y tira si falta algo.
 *
 * IMPORTANTE: NO incluye clientSegment. El backend lo deriva del JWT del
 * caller (audit #29) — el cliente NO puede pasarlo.
 *
 * Para preview público (sin login), usar transport-service POST /search
 * o payment-service POST /payments/quote.
 */
export class EstimateFareDto {
  /**
   * Servicio a cotizar (auditoría B1 #9). Opcional para no romper el preview
   * genérico, pero si viene, el priceToken devuelto queda atado a este serviceId
   * y create exige que coincida → el precio firmado no se puede reusar para otro
   * servicio del mismo tipo.
   */
  @IsOptional() @IsString()
  serviceId?: string;

  @IsEnum(['transport', 'shared', 'shared_route', 'envio', 'accommodation', 'tour', 'experience'])
  serviceType!:
    | 'transport'
    | 'shared'
    | 'shared_route'
    | 'envio'
    | 'accommodation'
    | 'tour'
    | 'experience';

  // ── Transport / shared / envio ──
  @IsOptional() @IsNumber() @Min(0)
  distanceKm?: number;

  @IsOptional() @IsNumber() @Min(0)
  durationMinutes?: number;

  @IsOptional() @IsNumber() @Min(0.1)
  surgeMultiplier?: number;

  // ── Envío ──
  @IsOptional() @IsNumber() @Min(0)
  weightKg?: number;

  @IsOptional() @IsBoolean()
  isIntercity?: boolean;

  @IsOptional() @IsString()
  originCity?: string;

  @IsOptional() @IsString()
  destinationCity?: string;

  @IsOptional() @IsBoolean()
  isOverVolume?: boolean;

  // ── Fixed (accommodation / tour / experience) ──
  @IsOptional() @IsNumber() @Min(0)
  baseAmount?: number;

  @IsOptional() @IsNumber() @Min(1)
  quantity?: number;

  // ── Shared route (Going carpool en rutas programadas) ──
  @IsOptional() @IsString()
  originStop?: string;

  @IsOptional() @IsString()
  quitoZone?: string;

  @IsOptional() @IsEnum(['suv', 'van'])
  vehicleType?: 'suv' | 'van';

  @IsOptional() @IsBoolean()
  frontSeat?: boolean;

  @IsOptional() @IsNumber() @Min(1)
  passengers?: number;
}
