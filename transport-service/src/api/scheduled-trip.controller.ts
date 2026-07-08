import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { ScheduledTripService } from '../application/scheduled-trip.service';
import { InternalServiceGuard } from './internal-service.guard';

export class ReserveSeatDto {
  /** Tramo del pasajero (claves FARES) — define el precio por asiento. */
  @IsString() originCity: string;
  @IsString() destCity: string;

  @IsInt() @Min(1) @Max(5) seats: number;

  /** Familia/amigos: habilita el asiento del centro trasero al mismo precio. */
  @IsOptional() @IsBoolean() isGroup?: boolean;

  /** Reservar el asiento delantero con exclusividad (+$3). */
  @IsOptional() @IsBoolean() wantsFrontExclusive?: boolean;
}

/**
 * Cuerpo de POST /scheduled-trips/attach-parcel (interno: lo llama
 * envios-service para adjuntar un envío interurbano a una salida programada).
 */
export class AttachParcelDto {
  @IsString() originCity: string;
  @IsString() destCity: string;
  /** Fecha/hora de referencia (ISO). Default: ahora. */
  @IsOptional() @IsString() requestedAt?: string;
  /** Sobre-volumen → consume 1 asiento del viaje. */
  @IsOptional() @IsBoolean() isOverVolume?: boolean;
}

/**
 * ScheduledTripController — reserva de asientos en viajes compartidos programados.
 *
 * POST /scheduled-trips/:id/reserve
 */
@Controller('scheduled-trips')
@UseGuards(JwtAuthGuard)
export class ScheduledTripController {
  constructor(private readonly service: ScheduledTripService) {}

  @Post(':id/reserve')
  @HttpCode(HttpStatus.OK)
  async reserve(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReserveSeatDto,
  ) {
    return this.service.reserveSeat(id, {
      userId,
      originCity: dto.originCity,
      destCity: dto.destCity,
      seats: dto.seats,
      isGroup: dto.isGroup,
      wantsFrontExclusive: dto.wantsFrontExclusive,
    });
  }
}

/**
 * Endpoints INTERNOS (servicio-a-servicio) de scheduled-trips. Protegidos con el
 * InternalServiceGuard (x-internal-token), NO con JWT de usuario — antes
 * attach-parcel vivía bajo el JWT de clase y cualquier usuario podía mutar el
 * inventario de asientos (auditoría #20).
 */
@Controller('scheduled-trips')
@UseGuards(InternalServiceGuard)
export class ScheduledTripInternalController {
  constructor(private readonly service: ScheduledTripService) {}

  /**
   * Adjunta un envío interurbano a la salida programada más próxima con cupo.
   * Llamado por envios-service (S2S con x-internal-token). Sin cupo → { attached: false }.
   * POST /scheduled-trips/attach-parcel
   */
  @Post('attach-parcel')
  @HttpCode(HttpStatus.OK)
  async attachParcel(@Body() dto: AttachParcelDto) {
    return this.service.attachParcel({
      originCity: dto.originCity,
      destCity: dto.destCity,
      requestedAt: dto.requestedAt ? new Date(dto.requestedAt) : new Date(),
      isOverVolume: dto.isOverVolume,
    });
  }
}
