import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsEnum,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TourCategory } from '@going-monorepo-clean/domains-tour-core';

class PriceDto {
  @ApiProperty({ example: 12000, description: 'Monto en centavos', minimum: 0 })
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
  @ApiProperty({ example: 'Calle García Moreno N5-59 y Chile, Centro Histórico', description: 'Dirección' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Quito', description: 'Ciudad' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Ecuador', description: 'País' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: -0.2201, description: 'Latitud' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -78.5123, description: 'Longitud' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}

export class CreateTourDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del anfitrión' })
  @IsNotEmpty()
  @IsUUID()
  hostId: string;

  @ApiProperty({ example: 'Tour gastronómico por los sabores de Quito', description: 'Título del tour' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Recorrido por los mercados y restaurantes tradicionales del Centro Histórico de Quito', description: 'Descripción del tour' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Ubicación del tour', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Precio del tour', type: () => PriceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;

  @ApiProperty({ example: 3, description: 'Duración del tour en horas', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationHours: number;

  @ApiProperty({ example: 15, description: 'Número máximo de invitados', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxGuests: number;

  @ApiProperty({ example: 'cultural', description: 'Categoría del tour', enum: TourCategory })
  @IsNotEmpty()
  @IsEnum(TourCategory)
  category: TourCategory;
}
