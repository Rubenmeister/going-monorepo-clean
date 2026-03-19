import { IsNumber, Min, Max, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Location Update DTO
 * Data transfer object for driver location updates
 */
export class LocationUpdateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(0)
  accuracy: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  timestamp?: Date;
}
