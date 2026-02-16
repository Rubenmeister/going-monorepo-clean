import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchExperienceDto {
  @ApiPropertyOptional({ example: 'Quito', description: 'Filtrar por ciudad' })
  @IsString()
  @IsOptional()
  locationCity?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Precio máximo en centavos', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;
}
