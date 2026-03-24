import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  serviceType?: string; // standard, premium, economy
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
