import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  ValidateNested,
  IsUUID,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@going-monorepo-clean/domains-booking-core';
import { MoneyDto } from '@going-monorepo-clean/shared-domain';

export class CreateBookingDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del usuario' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001', description: 'ID del servicio (transporte, alojamiento, tour, experiencia)' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 'transport', enum: ['transport', 'accommodation', 'tour', 'experience'], description: 'Tipo de servicio reservado' })
  @IsNotEmpty()
  @IsEnum(['transport', 'accommodation', 'tour', 'experience'])
  serviceType: ServiceType;

  @ApiProperty({ description: 'Precio total de la reserva', type: () => MoneyDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  totalPrice: MoneyDto;

  @ApiProperty({ example: '2025-03-15T10:00:00Z', description: 'Fecha de inicio del servicio' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiPropertyOptional({ example: '2025-03-20T10:00:00Z', description: 'Fecha de fin del servicio' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
