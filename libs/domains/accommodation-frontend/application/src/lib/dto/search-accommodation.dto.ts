import { IsString, IsOptional, IsNumber, Min, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAccommodationDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsDateString()
  @IsOptional()
  checkIn?: string;

  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  guests?: number;
}