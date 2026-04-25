import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsIn,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

// DTO para el Value Object 'Money'
export class MoneyDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number; // En centavos

  @IsNotEmpty()
  @IsIn(['USD'])
  currency: 'USD';
}

// DTO para el Value Object 'Location'.
//
// `city` y `country` se marcan opcionales porque las apps móviles no
// siempre tienen reverse-geocoding disponible — sólo address + lat/lng.
// El backend asume "Ecuador" cuando country falta, y deriva city desde
// Mapbox/OSRM si necesita persistirla. Los DTOs requieren address +
// lat/lng para poder rutear y persistir.
export class LocationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}