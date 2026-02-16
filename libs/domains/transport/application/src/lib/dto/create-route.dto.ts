import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from '@going-monorepo-clean/shared-domain';

export class RouteStopDto {
  @IsNumber()
  @Min(1)
  order: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNumber()
  @Min(0)
  estimatedArrivalMinutes: number;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];

  @IsNumber()
  @Min(0.1)
  distanceKm: number;

  @IsNumber()
  @Min(1)
  estimatedDurationMinutes: number;
}
