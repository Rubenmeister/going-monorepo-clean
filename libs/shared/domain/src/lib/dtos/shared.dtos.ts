import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsIn,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

// DTO para el Value Object 'Money'
export class MoneyDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount!: number; // En centavos

  @IsNotEmpty()
  @IsIn(['USD'])
  currency!: 'USD';
}

// DTO para el Value Object 'Location'
export class LocationDto {
  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsNotEmpty()
  @IsString()
  city!: string;
  
  @IsNotEmpty()
  @IsString()
  country!: string;

  @IsNotEmpty()
  @IsLatitude()
  latitude!: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude!: number;
}