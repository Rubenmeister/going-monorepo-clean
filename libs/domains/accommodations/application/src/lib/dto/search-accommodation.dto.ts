import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class SearchAccommodationDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  capacity?: number;
}