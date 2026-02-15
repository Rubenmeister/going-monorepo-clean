import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class PriceDto {
  @ApiProperty({ example: 15000, description: 'Monto en centavos', minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'USD', enum: ['USD'] })
  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

class LocationDto {
  @ApiProperty({ example: 'Calle 100 #15-20', description: 'Dirección' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Bogotá', description: 'Ciudad' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Colombia', description: 'País' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 4.6097, description: 'Latitud' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -74.0817, description: 'Longitud' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}

export class RequestTripDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del usuario que solicita el viaje' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Ubicación de origen', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({ description: 'Ubicación de destino', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiProperty({ description: 'Precio estimado del viaje', type: () => PriceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}
