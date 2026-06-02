import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ServiceType } from '@going-monorepo-clean/domains-booking-frontend-core';
import { MoneyDto } from '@going-monorepo-clean/shared-domain';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

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
