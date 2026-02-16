import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleCategory, MediaType } from '@going-monorepo-clean/domains-blog-core';

export class CreateArticleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del autor del articulo' })
  @IsNotEmpty()
  @IsUUID()
  authorId: string;

  @ApiProperty({ example: 'Los mejores destinos para viajar en 2026', description: 'Titulo del articulo (minimo 5 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Descubre los destinos mas increibles para tu proximo viaje...', description: 'Contenido completo del articulo' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'Resumen breve del articulo sobre los mejores destinos de viaje', description: 'Extracto o resumen corto del articulo' })
  @IsNotEmpty()
  @IsString()
  excerpt: string;

  @ApiProperty({ example: 'TRAVEL', enum: ArticleCategory, description: 'Categoria del articulo' })
  @IsNotEmpty()
  @IsEnum(ArticleCategory)
  category: ArticleCategory;

  @ApiProperty({ example: 'BLOG', enum: MediaType, description: 'Tipo de medio del articulo (blog, vlog, podcast)' })
  @IsNotEmpty()
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiPropertyOptional({ example: ['viajes', 'turismo', 'aventura'], description: 'Etiquetas del articulo' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'https://cdn.going.com/images/cover.jpg', description: 'URL de la imagen de portada' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=abc123', description: 'URL del video (para vlogs)' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
