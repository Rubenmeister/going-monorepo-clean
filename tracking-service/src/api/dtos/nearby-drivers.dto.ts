import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Nearby Drivers Query DTO
 */
export class NearbyDriversQueryDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.1)
  @Max(100)
  radius?: number; // in km, default 5

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number; // default 10
}

/**
 * Nearby Driver Response
 */
export class NearbyDriverResponse {
  driverId: string;
  name: string;
  rating: number;
  latitude: number;
  longitude: number;
  distance: number; // km
  eta: number; // seconds
  availableSeats: number;
  serviceTypes: string[];
}

/**
 * Nearby Drivers Response DTO
 */
export class NearbyDriversResponseDto {
  drivers: NearbyDriverResponse[];
  totalCount: number;
  searchRadius: number;
}
