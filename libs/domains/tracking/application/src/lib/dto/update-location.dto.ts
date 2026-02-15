import { IsNotEmpty, IsUUID, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del conductor' })
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @ApiProperty({ example: 4.6097, description: 'Latitud actual del conductor' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -74.0817, description: 'Longitud actual del conductor' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}
