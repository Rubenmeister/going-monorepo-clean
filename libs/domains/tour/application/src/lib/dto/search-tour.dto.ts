import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TourCategory } from '@going-monorepo-clean/domains-tour-core';

export class SearchTourDto {
  @ApiPropertyOptional({ example: 'Quito', description: 'Filtrar por ciudad' })
  @IsString()
  @IsOptional()
  locationCity?: string;

  @ApiPropertyOptional({ example: 'CULTURAL', enum: TourCategory, description: 'Filtrar por categoría' })
  @IsEnum(TourCategory)
  @IsOptional()
  category?: TourCategory;

  @ApiPropertyOptional({ example: 20000, description: 'Precio máximo en centavos', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;
}
