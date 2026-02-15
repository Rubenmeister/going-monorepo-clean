import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class PriceDto {
  @ApiProperty({ example: 5000, description: 'Monto en centavos (mínimo 50)', minimum: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(50) // 50 centavos
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Moneda (solo USD soportado)', enum: ['USD'] })
  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

export class CreatePaymentIntentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del usuario que realiza el pago' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001', description: 'ID de referencia (viaje, tour, etc.)' })
  @IsNotEmpty()
  @IsUUID()
  referenceId: string;

  @ApiProperty({ description: 'Precio del pago', type: () => PriceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}
