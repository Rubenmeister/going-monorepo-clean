import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
  IsIn,
  IsOptional,
  IsLatitude,
  IsLongitude,
  IsBoolean,
} from 'class-validator';
import { MoneyDto, LocationDto } from '@going-monorepo-clean/shared-domain'; // Asumiendo DTOs compartidos

export class CreateParcelDto {
  /**
   * userId — opcional en el body. El controller lo SOBRE-ESCRIBE con
   * el id del JWT (`req.user.id`); nunca confiamos en lo que mande el
   * cliente. Lo dejamos opcional para que ValidationPipe no rechace
   * la request.
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  origin?: LocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  destination?: LocationDto;

  // Mobile flat format fields (alternative to nested origin/destination)
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  fromLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  fromLongitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  toLatitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  toLongitude?: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  /**
   * Precio. El backend lo RECOMPUTA con libs/pricing y sobre-escribe este valor
   * (no se confía en el cliente). Se mantiene requerido por compatibilidad con
   * las apps actuales; el monto autoritativo sale de quoteEnvio.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;

  /** Tamaño del paquete → define el peso para cotizar (small/medium/large). */
  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  packageSize?: 'small' | 'medium' | 'large';

  /** Peso exacto en kg (alternativa a packageSize). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  /** Volumen grande aunque pese poco → cobra equivalente a 1 asiento. */
  @IsOptional()
  @IsBoolean()
  isOverVolume?: boolean;

  // ── Payment scheme ──────────────────────────────────────────────────────────
  // Combinación payerRole + paymentMethod determina el flujo:
  //  sender + card  → A: pre-pay con Datafast/DeUna antes de matchear
  //  sender + cash  → B: driver cobra al sender en pickup
  //  recipient + card → C: link enviado al receptor por SMS, paga antes de delivery
  //  recipient + cash → D: driver cobra al receptor en delivery (contra entrega)
  // Si se omiten, default = sender + cash (legacy behavior).

  @IsOptional()
  @IsIn(['card', 'cash'])
  paymentMethod?: 'card' | 'cash';

  @IsOptional()
  @IsIn(['sender', 'recipient'])
  payerRole?: 'sender' | 'recipient';

  /** Requerido si payerRole='recipient' (para enviar link SMS o contactar). */
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  /** Requerido si payerRole='recipient' + paymentMethod='card' (para personalizar SMS). */
  @IsOptional()
  @IsString()
  recipientName?: string;
}