import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsDate,
  ValidateNested,
  IsOptional,
  IsString,
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

  /**
   * Empresa corporativa dueña del booking (corporate-service lo setea).
   *
   * OJO: NO es un UUID pelado. El alta de empresa genera `comp_<uuid>`
   * (approveCompany), y ese mismo valor viaja en el JWT y se usa para el
   * aislamiento por tenant. Validarlo con @IsUUID() rechazaba con 400 TODA
   * reserva corporativa — que corporate-service convertía en un 500 opaco.
   */
  @IsOptional()
  @IsString()
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

  /**
   * Token de precio firmado emitido por POST /bookings/estimate (auditoría B1 #9).
   * Cuando viene, el booking-service usa su `total` como precio autoritativo e
   * ignora totalPrice del body → el cliente no puede manipular el precio. Opcional
   * en Fase 1 del rollout (webapp/móvil aún adoptándolo).
   */
  @IsOptional()
  @IsString()
  priceToken?: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
