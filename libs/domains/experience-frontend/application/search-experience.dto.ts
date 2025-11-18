import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchExperienceDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;
}