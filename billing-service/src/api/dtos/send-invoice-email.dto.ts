/**
 * Send Invoice Email DTO
 * Request data for sending an invoice via email
 */

import { IsEmail, IsOptional, IsArray, IsString } from 'class-validator';

export class SendInvoiceEmailDto {
  @IsEmail()
  @IsOptional()
  recipientEmail?: string; // If not provided, uses client.email

  @IsArray()
  @IsEmail({ each: true })
  @IsOptional()
  ccEmails?: string[];

  @IsString()
  @IsOptional()
  messageBody?: string; // Custom message to include in email
}
