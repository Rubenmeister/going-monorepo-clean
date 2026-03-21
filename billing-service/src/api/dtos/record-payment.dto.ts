/**
 * Record Payment DTO
 * Request data for recording a payment against an invoice
 */

import { IsNumber, IsString, IsOptional } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  amount: number; // Amount in cents

  @IsString()
  method: string; // e.g., 'bank_transfer', 'credit_card', 'cash'

  @IsOptional()
  @IsString()
  reference?: string; // e.g., transaction ID, check number
}
