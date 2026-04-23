import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsOptional,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain'; // Asumiendo DTOs compartidos

export class CreateParcelDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  origin?: LocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  destination?: LocationDto;

  // Mobile flat format fields (alternative to nested origin/destination)
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  fromLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  fromLongitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  toLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  toLongitude?: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;
}