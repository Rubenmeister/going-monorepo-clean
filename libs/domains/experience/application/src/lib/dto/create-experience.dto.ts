import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain';

export class CreateExperienceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del anfitrión' })
  @IsNotEmpty()
  @IsUUID()
  hostId: string;

  @ApiProperty({ example: 'Tour de café en el Eje Cafetero', description: 'Título de la experiencia' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Recorrido por fincas cafeteras con degustación', description: 'Descripción de la experiencia' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Ubicación de la experiencia', type: () => LocationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Precio de la experiencia', type: () => MoneyDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;

  @ApiProperty({ example: 4, description: 'Duración en horas (1-24)', minimum: 1, maximum: 24 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(24)
  durationHours: number;
}
