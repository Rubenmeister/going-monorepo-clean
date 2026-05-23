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

  @IsOptional()
  @IsEnum(['urban', 'intercity'])
  bookingType?: 'urban' | 'intercity';

  /** Empresa corporativa dueña del booking (corporate-service lo setea). */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(['b2c', 'corporate'])
  clientSegment?: 'b2c' | 'corporate';

  @IsOptional()
  @IsEnum(['immediate', 'corporate_monthly'])
  paymentMode?: 'immediate' | 'corporate_monthly';

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
