import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsDate,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { MoneyDto } from '@going-monorepo-clean/shared-domain';
import { ServiceType } from '@going-monorepo-clean/domains-booking-core';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsNotEmpty()
  @IsEnum(['transport', 'accommodation', 'tour', 'experience', 'parcel'])
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
