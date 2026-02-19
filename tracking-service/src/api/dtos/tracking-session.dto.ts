import { IsString, IsNumber, Min, Max } from 'class-validator';

/**
 * Create Tracking Session DTO
 */
export class CreateTrackingSessionDto {
  @IsString()
  tripId: string;

  @IsString()
  driverId: string;

  @IsString()
  userId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  startLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  startLongitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  endLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  endLongitude: number;
}

/**
 * Tracking Session Response DTO
 */
export class TrackingSessionResponseDto {
  id: string;
  tripId: string;
  driverId: string;
  userId: string;
  status: 'active' | 'completed' | 'cancelled';
  latitude: number;
  longitude: number;
  distance: number; // km
  duration: number; // seconds
  eta?: number; // seconds remaining
  routePoints: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Complete Tracking Session DTO
 */
export class CompleteTrackingSessionDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
