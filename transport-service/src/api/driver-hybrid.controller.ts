import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import {
  IDriverHybridContextRepository,
  DriverHybridContext,
} from '@going-monorepo-clean/domains-transport-core';
import { DriverHybridLifecycleService } from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * DriverHybridController
 *
 * Endpoints para que el driver gestione su Hybrid Mode desde la app
 * mobile-driver-app:
 *
 *   POST /driver-hybrid/start-local-mode
 *     Llamado cuando el driver llega al destino del intercity outbound
 *     y quiere habilitarse para carreras locales hasta el retorno.
 *
 *   POST /driver-hybrid/complete-return
 *     Llamado cuando el driver completa el retorno y vuelve a IDLE.
 *
 *   POST /driver-hybrid/cancel
 *     Llamado si el driver quiere salir del modo (cansancio, urgencia)
 *     o si el retorno fue cancelado por el pasajero.
 *
 *   GET  /driver-hybrid/me
 *     Devuelve el contexto activo del driver para que la UI renderice
 *     banner countdown / blocked screen / etc.
 *
 * Todos los endpoints requieren JWT con role='driver' (validado en
 * cada handler — un driver solo opera sobre su propio contexto).
 */

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
}

interface StartLocalModeDto {
  destinationCity: string;
  destLat: number;
  destLng: number;
  outboundScheduledTripId: string;
  returnScheduledTripId: string;
  nextLongTripStartTime: string; // ISO 8601
  localRadiusKm?: number;
  restBufferMinutes?: number;
}

@Controller('driver-hybrid')
@UseGuards(AuthGuard('jwt'))
export class DriverHybridController {
  private readonly logger = new Logger(DriverHybridController.name);

  constructor(
    private readonly lifecycle: DriverHybridLifecycleService,
    @Inject(IDriverHybridContextRepository)
    private readonly repo: IDriverHybridContextRepository,
  ) {}

  /**
   * Driver llegó al destino del intercity y quiere activar modo híbrido.
   */
  @Post('start-local-mode')
  @HttpCode(HttpStatus.OK)
  async startLocalMode(
    @CurrentUser() user: AuthUser,
    @Body() dto: StartLocalModeDto,
  ) {
    this.assertDriver(user);
    this.validateStartDto(dto);

    const nextTrip = new Date(dto.nextLongTripStartTime);
    if (nextTrip.getTime() <= Date.now()) {
      throw new BadRequestException(
        'nextLongTripStartTime debe ser futuro — no hay tiempo para el modo local',
      );
    }

    const result = await this.lifecycle.startLocalMode({
      driverId: user.id as UUID,
      destinationCity: dto.destinationCity,
      destLat: dto.destLat,
      destLng: dto.destLng,
      outboundScheduledTripId: dto.outboundScheduledTripId as UUID,
      returnScheduledTripId: dto.returnScheduledTripId as UUID,
      nextLongTripStartTime: nextTrip,
      localRadiusKm: dto.localRadiusKm,
      restBufferMinutes: dto.restBufferMinutes,
    });

    if (result.isErr()) {
      this.logger.warn(
        `startLocalMode fallo driver=${user.id}: ${result.error.message}`,
      );
      throw new BadRequestException(result.error.message);
    }

    return this.serialize(result.value);
  }

  /**
   * Driver completó el retorno. Aplica return_completed → IDLE.
   */
  @Post('complete-return')
  @HttpCode(HttpStatus.OK)
  async completeReturn(@CurrentUser() user: AuthUser) {
    this.assertDriver(user);
    const ctxResult = await this.repo.findActiveByDriverId(user.id as UUID);
    if (ctxResult.isErr()) {
      throw new BadRequestException(ctxResult.error.message);
    }
    const ctx = ctxResult.value;
    if (!ctx) {
      throw new BadRequestException(
        'No hay contexto híbrido activo para este driver',
      );
    }

    // Para return_completed solo aplica desde LONG_TRIP_RETURN. No usamos
    // lifecycle.endLocalMode porque ya pasamos por BLOCKED_REST → ahí la
    // base temporal ya fue desactivada. Aplicamos transición directa.
    const transitioned = ctx.transition({ kind: 'return_completed' });
    if (transitioned.isErr()) {
      throw new BadRequestException(
        `Estado ${ctx.state} no permite return_completed`,
      );
    }
    const saved = await this.repo.save(transitioned.value);
    if (saved.isErr()) {
      throw new BadRequestException(saved.error.message);
    }
    this.logger.log(
      `complete-return driver=${user.id.slice(0, 8)} ${ctx.state}→IDLE`,
    );
    return this.serialize(transitioned.value);
  }

  /**
   * Driver cancela el modo (retorno cancelado o opt-out). Desactiva
   * la base temporal si la había.
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: AuthUser) {
    this.assertDriver(user);
    const ctxResult = await this.repo.findActiveByDriverId(user.id as UUID);
    if (ctxResult.isErr()) {
      throw new BadRequestException(ctxResult.error.message);
    }
    const ctx = ctxResult.value;
    if (!ctx) {
      throw new BadRequestException(
        'No hay contexto híbrido activo para este driver',
      );
    }

    // return_cancelled solo es válido desde AVAILABLE_LOCAL o BLOCKED_REST.
    // Si está en LONG_TRIP_OUTBOUND / LONG_TRIP_RETURN, usamos abort.
    const event =
      ctx.state === 'AVAILABLE_LOCAL' || ctx.state === 'BLOCKED_REST'
        ? { kind: 'return_cancelled' as const }
        : { kind: 'abort' as const, reason: 'driver opted out' };

    const result = await this.lifecycle.endLocalMode(ctx, event);
    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }
    return this.serialize(result.value);
  }

  /**
   * Lookup del estado actual del driver. Si no hay contexto activo,
   * devuelve `{ state: 'IDLE', minutesUntilRestWindow: null, ... }`.
   * Usado por la UI mobile-driver-app para renderizar banner/blocked.
   */
  @Get('me')
  async getMyState(@CurrentUser() user: AuthUser) {
    this.assertDriver(user);
    const result = await this.repo.findActiveByDriverId(user.id as UUID);
    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }
    const ctx = result.value;
    if (!ctx) {
      return {
        state: 'IDLE' as const,
        active: false,
      };
    }
    return this.serialize(ctx);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private assertDriver(user: AuthUser): void {
    const roles = user.roles ?? [user.role];
    if (!roles.includes('driver') && !roles.includes('admin')) {
      throw new BadRequestException('Solo conductores pueden gestionar Hybrid Mode');
    }
  }

  private validateStartDto(dto: StartLocalModeDto): void {
    if (!dto.destinationCity || dto.destinationCity.trim().length < 2) {
      throw new BadRequestException('destinationCity inválida');
    }
    if (dto.destLat < -90 || dto.destLat > 90) {
      throw new BadRequestException('destLat fuera de rango');
    }
    if (dto.destLng < -180 || dto.destLng > 180) {
      throw new BadRequestException('destLng fuera de rango');
    }
    if (!dto.outboundScheduledTripId || !dto.returnScheduledTripId) {
      throw new BadRequestException('outbound/return scheduledTripId requeridos');
    }
    if (!dto.nextLongTripStartTime) {
      throw new BadRequestException('nextLongTripStartTime requerido');
    }
  }

  /** Shape que entiende la mobile-driver-app. */
  private serialize(ctx: DriverHybridContext) {
    return {
      state: ctx.state,
      active: ctx.state !== 'IDLE',
      destinationCity: ctx.destinationCity,
      nextLongTripStartTime: ctx.nextLongTripStartTime?.toISOString() ?? null,
      restWindowStartsAt: ctx.restWindowStartsAt?.toISOString() ?? null,
      restBufferMinutes: ctx.restBufferMinutes,
      minutesUntilRestWindow: ctx.minutesUntilRestWindow(),
      acceptingLocalRides: ctx.isAcceptingLocalRides(),
    };
  }
}
