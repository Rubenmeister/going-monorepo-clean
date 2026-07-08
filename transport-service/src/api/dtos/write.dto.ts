import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTOs validados para endpoints de ESCRITURA (auditoría #22). El ValidationPipe
 * global (whitelist+transform) solo valida clases DTO, no tipos objeto inline —
 * antes estos cuerpos entraban sin saneo (inyección NoSQL, campos sin límite).
 */
export class RateDriverDto {
  // Se acepta pero el servidor usa el driverId REAL del viaje (no este).
  @IsOptional() @IsString() @MaxLength(64) driverId?: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsBoolean() thumbsUp?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(40, { each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) tip?: number;
  @IsOptional() @IsString() @MaxLength(120) passengerName?: string;
}

export class SaveVehicleDto {
  @IsOptional() @IsString() @MaxLength(40) brand?: string;
  @IsOptional() @IsString() @MaxLength(40) model?: string;
  @IsOptional() @IsString() @MaxLength(8) year?: string;
  @IsOptional() @IsString() @MaxLength(12) plate?: string;
  @IsOptional() @IsString() @MaxLength(30) color?: string;
}
