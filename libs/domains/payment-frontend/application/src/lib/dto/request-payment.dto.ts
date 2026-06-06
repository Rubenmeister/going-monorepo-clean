import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { MoneyDto } from '@going-monorepo-clean/shared-domain';

export class RequestPaymentDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  referenceId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;
}
