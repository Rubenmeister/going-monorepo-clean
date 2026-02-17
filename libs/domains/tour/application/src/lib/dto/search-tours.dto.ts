import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { TourCategory } from '@going-monorepo-clean/domains-tour-core';

export class SearchToursDto {
  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsEnum(['ADVENTURE', 'CULTURAL', 'GASTRONOMY', 'NATURE'])
  category?: TourCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
