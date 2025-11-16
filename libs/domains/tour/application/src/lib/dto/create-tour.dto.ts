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
  @IsNotEmpty()
  @IsUUID()
  hostId: string;

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
  @IsEnum(TourCategory)
  category: TourCategory;
}