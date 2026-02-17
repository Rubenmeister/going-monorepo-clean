import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class SearchExperiencesDto {
  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
