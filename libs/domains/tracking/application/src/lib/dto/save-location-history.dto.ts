import { IsNotEmpty, IsUUID, IsLatitude, IsLongitude, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveLocationHistoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @ApiPropertyOptional({ example: '660e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiProperty({ example: 4.6097 })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -74.0817 })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 45.5, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({ example: 180, description: 'Heading in degrees (0-360)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ example: 10, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
