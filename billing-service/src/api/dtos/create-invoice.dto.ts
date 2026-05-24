/**
 * Create Invoice DTO
 * Request data for creating a new invoice
 */

import {
  IsString,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

class CompanyInfoDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email: string;

  @IsString()
  taxId: string;

  @IsOptional()
  @IsString()
  website?: string;
}

class ClientInfoDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}

class LineItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  taxRate: number;
}

class BankDetailsDto {
  @IsString()
  accountHolder: string;

  @IsString()
  accountNumber: string;

  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  @IsOptional()
  @IsString()
  iban?: string;
}

export class CreateInvoiceDto {
  @IsString()
  clientId: string;

  // @IsDefined necesario: @ValidateNested solo valida estructura INTERNA si
  // el campo existe — undefined pasa el pipe sin error y luego company.name
  // explota con TypeError 500 (audit sistémico tras SOS bug).
  @IsDefined({ message: 'company is required' })
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  company: CompanyInfoDto;

  @IsDefined({ message: 'client is required' })
  @ValidateNested()
  @Type(() => ClientInfoDto)
  client: ClientInfoDto;

  // Para arrays: @IsArray rechaza undefined automáticamente (necesita ser
  // array iterable) — pero solo si va antes/después de @ValidateNested. Con
  // @IsDefined explícito el mensaje de error es más claro al cliente.
  @IsDefined({ message: 'lineItems is required (array of items)' })
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsArray()
  lineItems: LineItemDto[];

  @IsEnum(['NET_30', 'NET_60', 'NET_90', 'DUE_ON_RECEIPT'])
  paymentTerms: string;

  @IsEnum(['es', 'en'])
  language: string;

  @IsEnum(['EUR', 'USD', 'GBP'])
  currency: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;
}
