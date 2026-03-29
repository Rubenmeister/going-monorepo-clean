import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Request Ride Matching DTO
 * POST /api/rides/:rideId/request-matching
 */
export class RequestRideMatchingDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLongitude: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLongitude?: number;

  @IsEnum(['ECONOMY', 'PREMIUM', 'SHARED', 'ANY'])
  vehicleType: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxRadius?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Driver Match DTO (in match results)
 */
export class DriverMatchDto {
  matchId: string;
  driverId: string;
  driverName: string;
  rating: number;
  acceptanceRate: number;
  distance: number;
  eta: number;
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
}

/**
 * Ride Matching Response DTO
 */
export class RideMatchingResponseDto {
  rideId: string;
  matchingId: string;
  status: 'MATCHING' | 'COMPLETED' | 'FAILED';
  matches: DriverMatchDto[];
  matchCount: number;
  expiresAt: Date;
}

/**
 * Accept Ride Match DTO
 * PUT /api/rides/:rideId/matches/:matchId/accept
 */
export class AcceptRideMatchDto {
  @IsUUID()
  matchId: string;
}

/**
 * Accept Match Response DTO
 */
export class AcceptMatchResponseDto {
  matchId: string;
  rideId: string;
  driverId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'PENDING';
  acceptedAt: Date;
  eta: number;
  driverName: string;
  driverRating: number;
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
}

/**
 * Reject Ride Match DTO
 * PUT /api/rides/:rideId/matches/:matchId/reject
 */
export class RejectRideMatchDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Reject Match Response DTO
 */
export class RejectMatchResponseDto {
  matchId: string;
  status: 'REJECTED';
  rejectedAt: Date;
}

/**
 * Get Available Drivers Query DTO
 * GET /api/rides/:rideId/available-drivers?radius=5&limit=10
 */
export class GetAvailableDriversQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  radius?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

/**
 * Available Driver DTO
 */
export class AvailableDriverDto {
  driverId: string;
  driverName: string;
  rating: number;
  acceptanceRate: number;
  distance: number;
  eta: number;
  latitude: number;
  longitude: number;
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
  status: 'available' | 'busy' | 'offline';
}

/**
 * Get Available Drivers Response DTO
 */
export class GetAvailableDriversResponseDto {
  drivers: AvailableDriverDto[];
  total: number;
  searchRadius: number;
  timestamp: Date;
}

/**
 * Ride Status Update DTO
 */
export class RideStatusUpdateDto {
  @IsEnum([
    'requested',
    'matching',
    'accepted',
    'in_progress',
    'completed',
    'cancelled',
  ])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  completionMetadata?: any;
}

/**
 * Driver Pending Rides Query DTO
 * GET /api/drivers/:driverId/pending-rides
 */
export class DriverPendingRidesQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
