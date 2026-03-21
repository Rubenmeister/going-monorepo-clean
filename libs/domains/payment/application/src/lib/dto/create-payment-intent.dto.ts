import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsOptional,
} from 'class-validator';

class PriceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(50) // 50 centavos
  amount: number;

  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

/**
 * Create Payment Intent DTO
 * Supports idempotent payment creation to prevent duplicate charges
 *
 * SECURITY: Idempotency Key
 * - Client should generate a unique UUID for each payment attempt
 * - Server uses this key to detect and prevent duplicate charges
 * - Same idempotency key returns the same payment intent (idempotent)
 * - Helps prevent double-charging on network retries
 *
 * Example flow:
 * 1. Client generates idempotencyKey = uuid()
 * 2. POST /payments/intent with idempotencyKey
 * 3. Server creates payment intent, stores mapping
 * 4. If request retried with same key, returns cached intent
 * 5. No duplicate charge occurs
 */
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotencyKey?: string; // UUID to prevent duplicate charges
  // If provided, payment is idempotent: same key = same result
  // If not provided, new payment intent always created
}
