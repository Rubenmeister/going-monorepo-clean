import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
  IsOptional,
  IsIn,
  IsUUID,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PriceDto {
  @ApiProperty({ example: 8000, description: 'Monto en centavos por noche', minimum: 0 })
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
  @ApiProperty({ example: 'Calle Larga 5-24 y Hermano Miguel', description: 'Dirección' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Cuenca', description: 'Ciudad' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Ecuador', description: 'País' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: -2.9001, description: 'Latitud' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -79.0059, description: 'Longitud' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}

export class CreateAccommodationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del anfitrión' })
  @IsNotEmpty()
  @IsUUID()
  hostId: string;

  @ApiProperty({ example: 'Casa en la playa', description: 'Título del alojamiento' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Hermosa casa frente al mar con vista al atardecer', description: 'Descripción del alojamiento' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Ubicación del alojamiento', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Precio por noche', type: () => PriceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  pricePerNight: PriceDto;

  @ApiProperty({ example: 4, description: 'Capacidad máxima de huéspedes', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: ['wifi', 'pool', 'parking'], description: 'Lista de amenidades' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
