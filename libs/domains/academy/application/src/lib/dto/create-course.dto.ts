import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseCategory, CourseLevel } from '@going-monorepo-clean/domains-academy-core';

class PriceDto {
  @ApiProperty({ example: 12000, description: 'Monto en centavos', minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'USD', enum: ['USD'] })
  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

export class CreateCourseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del instructor' })
  @IsNotEmpty()
  @IsUUID()
  instructorId: string;

  @ApiProperty({ example: 'Fundamentos de Marketing Digital', description: 'Titulo del curso' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Aprende las bases del marketing digital para negocios turisticos', description: 'Descripcion del curso' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'TECHNOLOGY', enum: CourseCategory, description: 'Categoria del curso' })
  @IsNotEmpty()
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({ example: 'BEGINNER', enum: CourseLevel, description: 'Nivel del curso' })
  @IsNotEmpty()
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty({ description: 'Precio del curso', type: () => PriceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;

  @ApiProperty({ example: 120, description: 'Duracion del curso en minutos', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 30, description: 'Numero maximo de estudiantes', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxStudents: number;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg', description: 'URL de la imagen del curso' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
