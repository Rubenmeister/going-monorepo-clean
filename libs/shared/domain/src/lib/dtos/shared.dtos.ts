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
import { ApiProperty } from '@nestjs/swagger';

// DTO para el Value Object 'Money'
export class MoneyDto {
  @ApiProperty({ example: 15000, description: 'Monto en centavos', minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number; // En centavos

  @ApiProperty({ example: 'USD', description: 'Moneda (solo USD soportado)', enum: ['USD'] })
  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

// DTO para el Value Object 'Location'
export class LocationDto {
  @ApiProperty({ example: 'Av. Amazonas N36-152 y Naciones Unidas', description: 'Dirección' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Quito', description: 'Ciudad' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Ecuador', description: 'País' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: -0.1807, description: 'Latitud' })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -78.4678, description: 'Longitud' })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}
