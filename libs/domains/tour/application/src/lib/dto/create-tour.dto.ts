import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { TourCategory } from '@going-monorepo-clean/domains-tour-core';

class PriceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

class LocationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}

export class CreateTourDto {
  // Inyectado por el controlador desde el JWT (hostId = user.id). Opcional en el
  // body porque el cliente NO lo envía; validarlo como requerido daba 400 y
  // rompía la creación (auditoría webapp #8).
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationHours: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxGuests: number;

  @IsNotEmpty()
  @IsIn(['ADVENTURE', 'CULTURAL', 'GASTRONOMY', 'NATURE'])
  category: TourCategory;
}
