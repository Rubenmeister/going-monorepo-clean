import {
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ClientSegment, RouteClass } from 'pricing';

/**
 * Punto geográfico (origen o destino) que envía la app.
 */
export class GeoPointDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  address?: string;
}

/**
 * SearchQueryDto — entrada del buscador unificado de VIAJES.
 *
 * El buscador resuelve automáticamente la dimensión espacial (urbano /
 * interurbano / corredor aeropuerto) por geocercas en el backend y combina
 * con la dimensión temporal que elige el cliente (inmediato / agendado).
 *
 * Nota: los ENVÍOS van por un flujo separado (no por aquí).
 * `userId` nunca viene del body — se toma del JWT en el controller.
 */
export class SearchQueryDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  pickup: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  destination: GeoPointDto;

  /** Preferencia temporal de la UI. Default: 'immediate'. */
  @IsOptional()
  @IsEnum(['immediate', 'scheduled'])
  temporalPreference?: 'immediate' | 'scheduled';

  /** Obligatorio (a nivel de negocio) si temporalPreference === 'scheduled'. */
  @IsOptional()
  @IsDateString()
  scheduledDateTime?: string;

  /** Segmento del cliente para recargos de pricing. Default: 'public'. */
  @IsOptional()
  @IsEnum(['public', 'agency', 'corporate'])
  clientSegment?: ClientSegment;

  /** Tipo de vehículo para cotización interurbana privada. Default: 'suv'. */
  @IsOptional()
  @IsEnum(['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus'])
  vehicleType?: 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus';
}

// ── Response shape ────────────────────────────────────────────────────────────

export interface SearchRouteInfo {
  routeClass: RouteClass;
  isIntercity: boolean;
  isAirportCorridor: boolean;
  originCity: string | null;
  originLabel: string | null;
  destinationCity: string | null;
  destinationLabel: string | null;
  distanceKm: number;
  estimatedDurationMinutes: number;
  inCoverage: boolean;
}

export interface OnDemandOption {
  serviceType:
    | 'urban_ride'
    | 'intercity_private_immediate'
    | 'airport_transfer';
  label: string;
  description: string;
  price: number;
  currency: string;
  estimatedEtaMinutes: number;
  vehicleType?: string;
  breakdown?: Record<string, number>;
}

/** Cupo de viaje compartido programado (Fase 2). */
export interface ScheduledOption {
  scheduledTripId: string;
  driverId: string;
  corridorId: string;
  routeLabel: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleModel?: string;
  driver?: { name?: string; rating?: number };
}

/** Sugerencia proactiva cuando no hay cupos exactos (Fase 2). */
export interface AlternativeSchedule extends ScheduledOption {
  recommendationReason: 'same_day_different_time' | 'adjacent_day';
}

export interface SearchResponseDto {
  searchId: string;
  route: SearchRouteInfo;
  temporalPreference: 'immediate' | 'scheduled';
  onDemandOptions: OnDemandOption[];
  scheduledOptions?: ScheduledOption[];
  alternativeSchedules?: AlternativeSchedule[];
  notices: string[];
}
