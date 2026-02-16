import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseCategory, CourseLevel } from '@going-monorepo-clean/domains-academy-core';

export class SearchCourseDto {
  @ApiPropertyOptional({ example: 'TECHNOLOGY', enum: CourseCategory, description: 'Filtrar por categoria' })
  @IsEnum(CourseCategory)
  @IsOptional()
  category?: CourseCategory;

  @ApiPropertyOptional({ example: 'BEGINNER', enum: CourseLevel, description: 'Filtrar por nivel' })
  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @ApiPropertyOptional({ example: 20000, description: 'Precio maximo en centavos', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'Marketing', description: 'Filtrar por titulo (busqueda parcial)' })
  @IsString()
  @IsOptional()
  title?: string;
}
