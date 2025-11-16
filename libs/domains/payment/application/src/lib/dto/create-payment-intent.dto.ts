import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested, IsUUID, IsIn } from 'class-validator';

class PriceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(50) // 50 centavos
  amount: number;

  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  referenceId: string; // ID del viaje, tour, etc.

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}