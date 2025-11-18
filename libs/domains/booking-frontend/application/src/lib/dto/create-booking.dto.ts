// Esta librería necesita 'class-validator'
// Ejecuta: npm install class-validator
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ServiceType } from '@going-monorepo-clean/domains-booking-core'; // Reemplaza con tu scope
import { MoneyDto } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export class CreateBookingDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string; // ID del Trip, Accommodation, o Tour

  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  totalPrice: MoneyDto;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}