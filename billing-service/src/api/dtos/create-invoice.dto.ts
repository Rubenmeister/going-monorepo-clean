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
  ValidateNested,
  Type,
} from 'class-validator';

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

  @ValidateNested()
  @Type(() => CompanyInfoDto)
  company: CompanyInfoDto;

  @ValidateNested()
  @Type(() => ClientInfoDto)
  client: ClientInfoDto;

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
