import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto, MoneyDto } from '@going-monorepo-clean/shared-domain';

export class CreateShipmentDto {
  @IsUUID()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.1)
  weightKg: number;

  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;
}
