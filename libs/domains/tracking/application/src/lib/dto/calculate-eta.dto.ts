import { IsNotEmpty, IsLatitude, IsLongitude, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateEtaDto {
  @ApiProperty({ example: 4.6097, description: 'Origin latitude' })
  @IsNotEmpty()
  @IsLatitude()
  originLatitude: number;

  @ApiProperty({ example: -74.0817, description: 'Origin longitude' })
  @IsNotEmpty()
  @IsLongitude()
  originLongitude: number;

  @ApiProperty({ example: 4.7110, description: 'Destination latitude' })
  @IsNotEmpty()
  @IsLatitude()
  destinationLatitude: number;

  @ApiProperty({ example: -74.0721, description: 'Destination longitude' })
  @IsNotEmpty()
  @IsLongitude()
  destinationLongitude: number;

  @ApiPropertyOptional({ example: 30, description: 'Average speed in km/h (default: 30)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  averageSpeedKmh?: number;
}

export class EtaResultDto {
  distanceKm: number;
  estimatedMinutes: number;
  averageSpeedKmh: number;
}
