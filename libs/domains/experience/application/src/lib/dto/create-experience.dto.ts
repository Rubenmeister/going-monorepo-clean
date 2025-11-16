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
  Max,
} from 'class-validator';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain'; // Asumiendo DTOs compartidos

export class CreateExperienceDto {
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
  @Type(() => LocationDto) // Asumiendo que LocationDto está en shared-domain
  location: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto) // Asumiendo que MoneyDto está en shared-domain
  price: MoneyDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(24)
  durationHours: number;
}