import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UUID } from '@going-monorepo-clean/shared-domain';

export class GetDriverLocationForTripDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  tripId: string;
}

export class DriverLocationForTripResultDto {
  driverId: UUID;
  tripId: UUID;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  updatedAt: Date;
  etaMinutes?: number;
}
