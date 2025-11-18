import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { MoneyDto } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export class RequestPaymentDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  referenceId: string; // ID de la reserva

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;
}