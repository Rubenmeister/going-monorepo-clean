import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain';

export class CreateParcelDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del usuario que envía' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Ubicación de recogida', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({ description: 'Ubicación de entrega', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiProperty({ example: 'Paquete frágil - documentos importantes', description: 'Descripción del envío' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Precio del envío', type: () => MoneyDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;
}
