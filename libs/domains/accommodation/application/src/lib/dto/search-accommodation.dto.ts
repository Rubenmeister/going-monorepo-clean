import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAccommodationDto {
  @ApiPropertyOptional({ example: 'Cartagena', description: 'Filtrar por ciudad' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Colombia', description: 'Filtrar por país' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 2, description: 'Capacidad mínima requerida', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  capacity?: number;
}
