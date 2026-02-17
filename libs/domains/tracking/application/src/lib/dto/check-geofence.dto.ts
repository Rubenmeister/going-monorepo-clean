import { IsNotEmpty, IsLatitude, IsLongitude, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckGeofenceDto {
  @ApiProperty({ example: 4.6097, description: 'Latitude of the point to check' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -74.0817, description: 'Longitude of the point to check' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;

  @ApiProperty({ example: 4.6100, description: 'Geofence center latitude' })
  @IsNotEmpty()
  @IsLatitude()
  centerLatitude: number;

  @ApiProperty({ example: -74.0800, description: 'Geofence center longitude' })
  @IsNotEmpty()
  @IsLongitude()
  centerLongitude: number;

  @ApiProperty({ example: 0.5, description: 'Geofence radius in km' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  radiusKm: number;

  @ApiPropertyOptional({ example: 'pickup-zone', description: 'Label for the geofence' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class CheckGeofenceResultDto {
  isInside: boolean;
  distanceKm: number;
  label?: string;
}
