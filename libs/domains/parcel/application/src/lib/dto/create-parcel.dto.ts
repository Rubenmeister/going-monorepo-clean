import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain';

export class CreateParcelDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}