import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export class RequestTripDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;
}