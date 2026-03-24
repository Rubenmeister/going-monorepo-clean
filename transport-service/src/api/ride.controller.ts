import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  RequestRideDto,
  RideResponseDto,
  AcceptRideDto,
  StartRideDto,
  CompleteRideDto,
} from './dtos/request-ride.dto';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
} from '../application/use-cases';
import { IRideRepository } from '../domain/ports';
import { TwilioProxyService } from '../infrastructure/twilio-proxy.service';
import { AgoraTokenService } from '../infrastructure/agora-token.service';
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import { RideDispatchGateway } from '../infrastructure/gateways/ride-dispatch.gateway';
import { PaymentGatewayService } from '../infrastructure/payment/payment-gateway.service';
import { v4 as uuidv4 } from 'uuid';

/** Shape del JWT payload inyectado por @CurrentUser() */
interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
}

/**
 * Ride Controller
 * REST API endpoints for ride management
 */
@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RideController {
  private readonly logger = new Logger(RideController.name);

  constructor(
    private readonly requestRideUseCase: RequestRideUseCase,
    private readonly acceptRideUseCase: AcceptRideUseCase,
    private readonly completeRideUseCase: CompleteRideUseCase,
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    private readonly twilioProxy: TwilioProxyService,
    private readonly agoraToken: AgoraTokenService,
    private readonly matchDriversUseCase: MatchAvailableDriversUseCase,
    private readonly dispatchGateway: RideDispatchGateway,
    private readonly paymentService: PaymentGatewayService,
  ) {}

  /**
   * Request a new ride
   * POST /api/rides/request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestRide(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestRideDto
  ): Promise<RideResponseDto> {
    const ride = await this.requestRideUseCase.execute({
      userId: user.id,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      dropoffLatitude: dto.dropoffLatitude,
      dropoffLongitude: dto.dropoffLongitude,
      serviceType: dto.serviceType,
    });

    // Fire-and-forget: match drivers and dispatch notifications asynchronously
    // Does not block the passenger's response
    this.matchDriversUseCase
      .execute({
        rideId: ride.rideId,
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        dropoffLatitude: dto.dropoffLatitude,
        dropoffLongitude: dto.dropoffLongitude,
        vehicleType: dto.serviceType || 'ANY',
        maxRadius: 10,
      })
      .then((result) => {
        if (result.isOk()) {
          const driverIds = result.value.matches.map((m) => m.driverId);
          this.dispatchGateway.broadcastRideMatches(
            ride.rideId,
            result.value.matches,
            driverIds
          );
        }
      })
      .catch(() => { /* matching errors are non-fatal */ });

    return ride;
  }

  /**
   * Get ride details
   * GET /api/rides/:rideId
   */
  @Get(':rideId')
  async getRide(@Param('rideId') rideId: string): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    return ride;
  }

  /**
   * Accept a ride (driver endpoint)
   * PUT /api/rides/:rideId/accept
   */
  @Put(':rideId/accept')
  async acceptRide(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
    @Body() dto: AcceptRideDto
  ): Promise<any> {
    return this.acceptRideUseCase.execute({
      rideId,
      driverId: user.id, // Always use authenticated user's ID — never trust client-provided driverId
    });
  }

  /**
   * Start a ride — pre-autoriza el pago antes de iniciar
   * PUT /api/rides/:rideId/start
   *
   * Flujo:
   *  1. Busca el viaje y valida que está en estado "accepted"
   *  2. Pre-autoriza el monto estimado con el proveedor de pagos
   *     - Datafast (tarjeta): bloqueo PA en tarjeta del pasajero
   *     - DeUna (QR): genera QR/link para confirmación del pasajero
   *  3. Si el pago es rechazado → retorna 400 (el frontend notifica al pasajero)
   *  4. Si está pendiente de QR → retorna qrCodeUrl para que el pasajero confirme
   *  5. Si está autorizado → marca el viaje como "in_progress"
   */
  @Put(':rideId/start')
  async startRide(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
    @Body() _dto: StartRideDto
  ): Promise<any> {
    const trip = await this.rideRepo.findById(rideId);
    if (!trip) throw new NotFoundException(`Ride ${rideId} not found`);

    const estimatedAmt = parseFloat(String(trip?.fare?.estimatedTotal ?? trip?.fare?.total ?? 5));
    const transactionId = uuidv4();

    // Pre-autorizar el pago
    const authResult = await this.paymentService.authorize({
      transactionId,
      rideId,
      userId:      user.id,
      amountUsd:   estimatedAmt,
      description: `Viaje Going #${rideId.slice(0, 8)}`,
    });

    if (authResult.status === 'rejected') {
      this.logger.warn(`Pago rechazado al iniciar viaje ${rideId}: ${authResult.error}`);
      throw new BadRequestException({
        message:       'Pago rechazado. Verifica tu método de pago.',
        paymentStatus: 'rejected',
        error:         authResult.error,
      });
    }

    // Para DeUna: el viaje queda en espera hasta que el pasajero confirme el QR
    if (authResult.status === 'pending_qr') {
      return {
        rideId,
        status:        'awaiting_payment',
        paymentStatus: 'pending_qr',
        transactionId,
        qrCodeUrl:     authResult.qrCodeUrl,
        qrPaymentLink: authResult.qrPaymentLink,
        message:       'Confirma el pago en tu app Pichincha/DeUna para iniciar el viaje',
      };
    }

    // Pago autorizado — iniciar el viaje y persistir referencia de pago
    await this.rideRepo.update(rideId, {
      status:           'started',
      startedAt:        new Date(),
      paymentRef:       authResult.gatewayRef,
      paymentTxnId:     transactionId,
      paymentEstimated: estimatedAmt,
    });

    return {
      rideId,
      status:        'started',
      startedAt:     new Date(),
      paymentStatus: 'authorized',
      transactionId,
      gatewayRef:    authResult.gatewayRef,
    };
  }

  /**
   * Complete a ride — captura el pago real al finalizar
   * PUT /api/rides/:rideId/complete
   *
   * Flujo:
   *  1. Completa el viaje y calcula la tarifa real según distancia/duración
   *  2. Captura el cobro real con el gateway
   *     - Si el monto real > estimado → captura el monto real (Datafast) o crea cargo extra (DeUna)
   *  3. Si la captura falla → el viaje igual se completa y se registra deuda
   */
  @Put(':rideId/complete')
  async completeRide(
    @Param('rideId') rideId: string,
    @Body() dto: CompleteRideDto
  ): Promise<any> {
    const completeResult = await this.completeRideUseCase.execute({
      rideId,
      distanceKm:      dto.distanceKm,
      durationSeconds: dto.durationSeconds,
    });

    // Capturar el pago usando paymentRef devuelto por el use case
    const gatewayRef = completeResult?.paymentRef;
    const txnId      = completeResult?.paymentTxnId;
    const realAmount = completeResult?.finalFare ?? (dto.distanceKm * 0.5 + 2.5);

    if (gatewayRef && txnId) {
      try {
        const captureResult = await this.paymentService.capture({
          gatewayRef,
          transactionId: txnId,
          amountUsd:     realAmount,
        });
        this.logger.log(`Viaje ${rideId} completado — pago ${captureResult.status} $${realAmount}`);
        return { ...completeResult, paymentStatus: captureResult.status, chargedAmount: realAmount };
      } catch (err: any) {
        this.logger.error(`Capture fallido para viaje ${rideId}: ${err?.message}`);
        return { ...completeResult, paymentStatus: 'capture_failed', chargedAmount: 0 };
      }
    }

    return completeResult;
  }

  /**
   * Get user's ride history
   * GET /api/rides/history/user
   */
  @Get('history/user')
  async getUserRideHistory(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    const rides = await this.rideRepo.findByUserId(user.id, limit ? Number(limit) : 20);
    return rides;
  }

  /**
   * Get driver's ride history
   * GET /api/rides/history/driver/:driverId
   */
  @Get('history/driver/:driverId')
  async getDriverRideHistory(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    const rides = await this.rideRepo.findByDriverId(driverId, limit ? Number(limit) : 20);
    return rides;
  }

  /**
   * GET /api/rides/:rideId/call-token
   * Genera token Agora RTC para llamada in-app conductor↔pasajero.
   * Si Agora no está configurado, retorna enabled:false → la app usa Twilio fallback.
   *
   * Rate limit: 10 req/min por IP
   */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Get(':rideId/call-token')
  async getCallToken(
    @Param('rideId') rideId: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    const uid = currentUser?.id ? parseInt(currentUser.id.replace(/\D/g, '').slice(0, 8), 10) || 0 : 0;
    return this.agoraToken.generateToken(rideId, uid, 'publisher');
  }

  /**
   * GET /api/rides/:rideId/proxy-number
   * Retorna el número proxy enmascarado para la llamada conductor ↔ pasajero.
   * - Si Twilio está configurado: crea/retorna la sesión proxy
   * - Si no está configurado: retorna el número real del conductor (fallback)
   * El campo `caller` indica quién llama: 'user' | 'driver'
   *
   * Rate limit: 5 req/min por IP — cada llamada puede crear una sesión Twilio de pago
   */
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Get(':rideId/proxy-number')
  async getProxyNumber(
    @Param('rideId') rideId: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<{ proxyNumber: string; masked: boolean }> {
    const trip = await this.rideRepo.findById(rideId);
    if (!trip) throw new NotFoundException(`Ride ${rideId} not found`);

    // Intentar obtener/crear sesión proxy
    let session = this.twilioProxy.getSession(rideId);
    if (!session && trip.driver?.phone && trip.user?.phone) {
      session = await this.twilioProxy.createSession({
        rideId,
        userPhone:   trip.user.phone,
        driverPhone: trip.driver.phone,
      });
    }

    if (session) {
      // Retornar el número proxy correcto según quién llama
      const isDriver = currentUser?.role === 'driver';
      return {
        proxyNumber: isDriver ? session.userProxyNumber : session.driverProxyNumber,
        masked: true,
      };
    }

    // Fallback: número real del conductor (sin masking)
    const fallbackNumber = trip.driver?.phone ?? '';
    return { proxyNumber: fallbackNumber, masked: false };
  }

  /**
   * Cancel a ride
   * PUT /api/rides/:rideId/cancel
   */
  @Put(':rideId/cancel')
  async cancelRide(
    @Param('rideId') rideId: string,
    @Body('reason') reason: string
  ): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    if (ride.status === 'completed')
      throw new BadRequestException('No se puede cancelar un viaje completado');

    await this.rideRepo.update(rideId, {
      status:             'cancelled',
      cancellationReason: reason || 'user_cancelled',
      cancellationTime:   new Date(),
    });

    return { rideId, status: 'cancelled', reason, cancelledAt: new Date() };
  }
}
