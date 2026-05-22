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
