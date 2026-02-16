import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleCategory, MediaType } from '@going-monorepo-clean/domains-blog-core';

export class SearchArticleDto {
  @ApiPropertyOptional({ example: 'TRAVEL', enum: ArticleCategory, description: 'Filtrar por categoria' })
  @IsEnum(ArticleCategory)
  @IsOptional()
  category?: ArticleCategory;

  @ApiPropertyOptional({ example: 'BLOG', enum: MediaType, description: 'Filtrar por tipo de medio' })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiPropertyOptional({ example: 'viajes', description: 'Filtrar por etiqueta' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ example: 'mejores destinos', description: 'Buscar por titulo (parcial)' })
  @IsString()
  @IsOptional()
  title?: string;
}
