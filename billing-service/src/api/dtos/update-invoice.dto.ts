/**
 * Update Invoice DTO
 * Request data for updating an invoice
 */

import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
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

class ClientInfoDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
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

export class UpdateInvoiceDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientInfoDto)
  client?: ClientInfoDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsArray()
  lineItems?: LineItemDto[];

  @IsOptional()
  @IsEnum(['NET_30', 'NET_60', 'NET_90', 'DUE_ON_RECEIPT'])
  paymentTerms?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}
