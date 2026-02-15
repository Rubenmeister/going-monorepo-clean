import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ServiceType } from '@going-monorepo-clean/domains-booking-core';
import { MoneyDto } from '@going-monorepo-clean/shared-domain';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsNotEmpty()
  @IsEnum(['transport', 'accommodation', 'tour', 'experience'])
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
