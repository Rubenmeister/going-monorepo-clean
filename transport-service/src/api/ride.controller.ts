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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { Storage } from '@google-cloud/storage';
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
import { TokenService } from '../infrastructure/token.service';
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import { RideMatchingService } from '../application/ride-matching.service';
import { RideDispatchGateway } from '../infrastructure/gateways/ride-dispatch.gateway';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';
import { PaymentGatewayService } from '../infrastructure/payment/payment-gateway.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverRatingModel, DriverRatingDocument } from './driver.controller';
import { v4 as uuidv4 } from 'uuid';

/** Shape del JWT payload inyectado por @CurrentUser() */
interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
  /** Empresa corporativa del usuario (audit #29). Set si el JWT lleva companyId. */
  companyId?: string;
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
    private readonly rideMatching: RideMatchingService,
    private readonly dispatchGateway: RideDispatchGateway,
    private readonly eventsGateway: RideEventsGateway,
    private readonly paymentService: PaymentGatewayService,
    private readonly tokenService: TokenService,
    private readonly httpService: HttpService,
    @InjectModel(DriverRatingModel.name)
    private readonly ratingModel: Model<DriverRatingDocument>,
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
    // Server-side enforcement (audit #29): isCorporate se DERIVA del JWT
    // (user.companyId), no del body del cliente. Admin puede sobreescribir
    // para testear/auditar; resto de roles ignoran dto.isCorporate.
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    const isCorporate = isAdmin
      ? (dto.isCorporate ?? !!user.companyId)
      : !!user.companyId;

    // ¿Es una RESERVA (viaje programado a futuro) o un viaje INMEDIATO
    // ("en la ciudad")? La regla es por scheduledAt: si llega una fecha
    // futura → reserva; si no llega o ya pasó → inmediato.
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const isFutureScheduled =
      !!scheduledAt && !isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now();

    const ride = await this.requestRideUseCase.execute({
      userId: user.id,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      dropoffLatitude: dto.dropoffLatitude,
      dropoffLongitude: dto.dropoffLongitude,
      serviceType: dto.serviceType,
      scheduledAt: isFutureScheduled ? scheduledAt : undefined,
      // status='scheduled' deja el viaje "en agenda": el cron lo despacha
      // MATCH_LEAD_TIME_MINUTES antes. Inmediato sigue con el default.
      initialStatus: isFutureScheduled ? 'scheduled' : undefined,
      lockedFare: isFutureScheduled ? dto.lockedFare : undefined,
    });

    if (isFutureScheduled) {
      // RESERVA: NO se busca conductor ahora. El viaje queda anotado para
      // tal fecha/hora con el precio fijado. ScheduledRideDispatcherCron
      // disparará el matching ~1h antes (configurable). Devolvemos de una.
      this.logger.log(
        `[scheduled] ride ${ride.rideId} reservado para ${scheduledAt!.toISOString()} ` +
          `(lockedFare=${dto.lockedFare ?? 'n/a'}) — matching diferido`,
      );
      return ride;
    }

    // INMEDIATO ("en la ciudad"): buscar al conductor activo más cercano ya.
    // Fire-and-forget para no bloquear la respuesta al pasajero.
    this.rideMatching.dispatchMatching({
      rideId: ride.rideId,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      dropoffLatitude: dto.dropoffLatitude,
      dropoffLongitude: dto.dropoffLongitude,
      vehicleType: dto.serviceType || 'ANY',
      isCorporate,
    });

    return ride;
  }

  /**
   * Listado de rides pendientes para que el driver-app haga polling.
   * Sustituye al `GET /transport/pending` legacy: cuando mobile-driver-app
   * migra al Sistema B, llama acá para descubrir viajes que aún no tienen
   * conductor asignado. Usa el mismo shape que mobile espera (PendingTrip).
   * GET /api/rides/pending
   */
  @Get('pending')
  async getPendingRides(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    const max = limit ? Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50) : 20;
    // Para conductores, excluimos viajes que YA RECHAZARON (rejectedByDriverIds)
    // para que no se les muestre el mismo viaje en cada poll. Para admins/users
    // no aplica filtro — ven todos los pendientes.
    const excludeDriverId = user.role === 'driver' ? user.id : undefined;
    const rides = await this.rideRepo.findByStatus('pending', max, excludeDriverId);
    return rides.map((r: any) => ({
      id:     r.rideId ?? r.id,
      userId: r.userId,
      origin: {
        address:   r.pickupLocation?.address ?? '',
        latitude:  r.pickupLocation?.latitude  ?? r.pickupLatitude  ?? 0,
        longitude: r.pickupLocation?.longitude ?? r.pickupLongitude ?? 0,
      },
      destination: {
        address:   r.dropoffLocation?.address ?? '',
        latitude:  r.dropoffLocation?.latitude  ?? r.dropoffLatitude  ?? 0,
        longitude: r.dropoffLocation?.longitude ?? r.dropoffLongitude ?? 0,
      },
      price: {
        amount:   r.fare?.estimatedTotal ?? r.fare?.total ?? 0,
        currency: 'USD',
      },
      status: r.status,
    }));
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
   * Reject a ride (driver endpoint)
   * POST /api/rides/:rideId/reject
   *
   * El conductor declina la oferta. Marca el viaje como rechazado por ESTE
   * driver en `rejectedByDriverIds`. El viaje sigue en estado 'pending' y
   * otros conductores siguen viéndolo. GET /rides/pending filtra los rechazos
   * para que el mismo conductor no reciba la oferta de nuevo.
   *
   * Idempotente: rechazos repetidos del mismo conductor son no-op (efectos: 0).
   */
  @Post(':rideId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRide(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
    @Body() body: { reason?: string } = {},
  ): Promise<{ rideId: string; status: string }> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    await this.rideRepo.addRejection(rideId, user.id);
    this.logger.log(
      `Driver ${user.id} rejected ride ${rideId}${body?.reason ? ` (reason: ${body.reason})` : ''}`,
    );
    return { rideId, status: 'rejected_by_driver' };
  }

  /**
   * SOS / emergencia activada por el pasajero durante un viaje activo
   * POST /api/rides/:rideId/sos
   *
   * Body opcional: { currentLat?, currentLng?, message? }
   *
   * Acciones:
   *  - Log estructurado (Cloud Logging, severity ALERT) para que ops detecte
   *  - Emit evento `ride:sos` al room ride:{rideId} (admins suscritos verán)
   *  - Retorna 201 inmediato — la app no espera notificaciones manuales
   *
   * Importante: el endpoint NUNCA debe fallar si los side effects fallan.
   * El pasajero está en peligro — primero confirmamos recepción, luego
   * intentamos notificar.
   */
  @Post(':rideId/sos')
  @HttpCode(HttpStatus.CREATED)
  async sosAlert(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
    @Body() body: { currentLat?: number; currentLng?: number; message?: string } = {},
  ): Promise<{ rideId: string; alertId: string; received: true }> {
    const alertId = uuidv4();
    const payload = {
      alertId,
      rideId,
      userId: user.id,
      currentLat: body.currentLat,
      currentLng: body.currentLng,
      message: body.message,
      receivedAt: new Date().toISOString(),
    };

    // 1. Log SOS — severity alta para que ops-agent y Cloud Logging lo recojan
    this.logger.error(`[SOS_ALERT] ${JSON.stringify(payload)}`);

    // 2. Emit a admins/ops via WebSocket (best-effort, no fail si gateway down)
    try {
      this.eventsGateway['server']?.emit('ride:sos', payload);
    } catch (e) {
      this.logger.warn(`SOS emit fallo (no critico): ${(e as Error).message}`);
    }

    // 3. Retornar éxito inmediato — la pantalla de SOS muestra confirmación
    return { rideId, alertId, received: true };
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
    const result = await this.acceptRideUseCase.execute({
      rideId,
      driverId: user.id,
    });

    // Notificar al pasajero en tiempo real via WebSocket
    this.eventsGateway.notifyDriverAccepted(rideId, {
      name:    dto.driverName    ?? user.id,
      vehicle: dto.vehicleModel  ?? 'Vehículo',
      plate:   dto.vehiclePlate  ?? '',
      rating:  dto.driverRating  ?? 5.0,
      photoUrl: dto.driverPhoto,
      eta:     dto.etaMinutes,
    });

    return result;
  }

  /**
   * Mark driver as arrived at pickup point
   * PUT /api/rides/:rideId/arrive
   *
   * Transición: accepted → arriving
   * Notifica al pasajero en tiempo real que el conductor llegó.
   */
  @Put(':rideId/arrive')
  async driverArrived(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
  ): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    if (ride.status !== 'accepted') {
      throw new BadRequestException(
        `Can only mark arriving from accepted status (current: ${ride.status})`,
      );
    }

    const updated = await this.rideRepo.update(rideId, {
      status: 'arriving',
      arrivedAt: new Date(),
    });

    // Notificar al pasajero via WebSocket
    this.eventsGateway['server']?.to(`ride:${rideId}`).emit('ride:driver_arrived', {
      rideId,
      message: 'Tu conductor ha llegado al punto de recogida',
      arrivedAt: new Date(),
    });

    this.logger.log(`Driver ${user.id} arrived for ride ${rideId}`);

    return {
      rideId: updated.id,
      status: updated.status,
      arrivedAt: updated.arrivedAt,
    };
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

    if (trip.status !== 'accepted' && trip.status !== 'arriving') {
      throw new BadRequestException(
        `Can only start rides in accepted or arriving status (current: ${trip.status})`,
      );
    }

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
  @UseGuards(JwtAuthGuard)
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

    const updated = await this.rideRepo.update(rideId, {
      status:             'cancelled',
      cancellationReason: reason || 'user_cancelled',
      cancellationTime:   new Date(),
    });

    // Anular pre-autorización de pago si existía
    if (updated.paymentRef && updated.paymentTxnId) {
      try {
        await this.paymentService.voidAuthorization({
          gatewayRef:    updated.paymentRef,
          transactionId: updated.paymentTxnId,
        });
        this.logger.log(`Pre-auth anulada para ride ${rideId} (ref: ${updated.paymentRef})`);
      } catch (err: any) {
        this.logger.warn(`No se pudo anular pre-auth de ride ${rideId}: ${err?.message}`);
      }
    }

    // Sincronizar estado de booking en el servicio de bookings (no-blocking)
    if (updated.bookingId) {
      this.syncBookingStatusAsync(updated.bookingId, 'cancelled');
    }

    // Notificar al conductor y pasajero via WebSocket
    this.eventsGateway['server']?.to(`ride:${rideId}`).emit('ride:cancelled', {
      rideId,
      reason: reason || 'user_cancelled',
      cancelledAt: new Date(),
    });

    return { rideId, status: 'cancelled', reason, cancelledAt: new Date() };
  }

  /**
   * Sincroniza el estado del booking con el servicio de bookings (sin bloquear)
   */
  private async syncBookingStatusAsync(bookingId: string, status: string): Promise<void> {
    try {
      const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3006';
      await this.httpService
        .patch(`${bookingServiceUrl}/bookings/${bookingId}`, { status })
        .toPromise()
        .catch((err) => {
          this.logger.warn(
            `Could not sync booking ${bookingId} status: ${err?.message}`,
          );
        });
    } catch (err: any) {
      this.logger.warn(
        `Could not sync booking ${bookingId} status: ${err?.message}`,
      );
    }
  }

  /**
   * Verificar token de recogida (conductor escanea QR del pasajero/paquete)
   * POST /api/rides/:rideId/verify-pickup
   * Body: { token: string }
   */
  @Post(':rideId/verify-pickup')
  async verifyPickup(
    @Param('rideId') rideId: string,
    @Body('token') token: string,
  ): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    if (ride.pickupVerified) return { ok: true, alreadyVerified: true };

    const result = this.tokenService.verifyPickupToken(token);
    if (!result.valid || result.rideId !== rideId) {
      throw new BadRequestException('Token de recogida inválido o expirado');
    }

    // Generar deliveryToken ahora que la recogida fue verificada
    const deliveryToken = this.tokenService.generateDeliveryToken(rideId);
    await this.rideRepo.update(rideId, {
      pickupVerified: true,
      deliveryToken,
    });

    // Notificar al pasajero via WebSocket
    this.eventsGateway['server']?.to(`ride:${rideId}`).emit('ride:pickup_verified', {
      rideId,
      message: '✅ Identidad verificada — ¡buen viaje!',
      deliveryToken,
    });

    return { ok: true, deliveryToken };
  }

  /**
   * Confirmar entrega (pasajero/receptor entrega código + conductor sube foto)
   * POST /api/rides/:rideId/confirm-delivery
   * Body: { deliveryToken: string } + foto opcional (multipart)
   */
  @Post(':rideId/confirm-delivery')
  @UseInterceptors(FileInterceptor('photo'))
  async confirmDelivery(
    @Param('rideId') rideId: string,
    @Body('deliveryToken') deliveryToken: string,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    if (ride.deliveryVerified) return { ok: true, alreadyVerified: true };

    // Validar código de 6 dígitos
    if (!deliveryToken || deliveryToken !== ride.deliveryToken) {
      throw new BadRequestException('Código de entrega incorrecto');
    }

    let photoUrl: string | undefined;

    // Subir foto a GCS si se adjuntó
    if (photo?.buffer) {
      try {
        const bucket  = process.env.GCS_BUCKET ?? 'going-deliveries';
        const storage = new Storage();
        const fileName = `deliveries/${rideId}/${Date.now()}.jpg`;
        const file    = storage.bucket(bucket).file(fileName);

        await file.save(photo.buffer, {
          metadata: { contentType: photo.mimetype || 'image/jpeg' },
          public: false,
        });
        photoUrl = `https://storage.googleapis.com/${bucket}/${fileName}`;
      } catch (err: any) {
        this.logger.error(`GCS photo upload failed for ride ${rideId}: ${err?.message}`);
        // No bloqueamos la entrega si falla la foto
      }
    }

    await this.rideRepo.update(rideId, {
      deliveryVerified: true,
      deliveryPhotoUrl: photoUrl,
      status: 'completed',
      completedAt: new Date(),
    });

    // Notificar a todos via WebSocket
    this.eventsGateway['server']?.to(`ride:${rideId}`).emit('ride:delivery_confirmed', {
      rideId,
      message: '📦 Entrega confirmada',
      photoUrl,
      confirmedAt: new Date(),
    });

    return { ok: true, rideId, photoUrl, confirmedAt: new Date() };
  }

  /**
   * Token de FIN DE VIAJE emitido por el servidor.
   * Sustituye al código que antes se calculaba en el cliente a partir del
   * rideId (determinístico e inseguro). El pasajero muestra este código y el
   * conductor lo confirma vía POST /confirm-delivery, que lo valida contra el
   * servidor antes de cerrar el viaje.
   * GET /api/rides/:rideId/end-token
   */
  @Get(':rideId/end-token')
  async getEndToken(
    @Param('rideId') rideId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ endToken: string; status: string; verified: boolean }> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    // Solo el dueño del viaje (o un admin) puede ver su código de cierre.
    if (ride.userId !== user.id && user.role !== 'admin') {
      throw new BadRequestException('No autorizado para este viaje');
    }

    // No se emiten códigos para viajes ya cerrados o cancelados.
    const terminal = ['completed', 'cancelled', 'canceled'];
    let endToken = ride.deliveryToken;
    if (!endToken && !terminal.includes(ride.status)) {
      endToken = this.tokenService.generateDeliveryToken(rideId);
      await this.rideRepo.update(rideId, { deliveryToken: endToken });
    }

    return {
      endToken: endToken ?? '',
      status: ride.status,
      verified: !!ride.deliveryVerified,
    };
  }

  /**
   * Obtener link de seguimiento público
   * GET /api/rides/:rideId/share-link
   */
  @Get(':rideId/share-link')
  async getShareLink(@Param('rideId') rideId: string): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    // Generar o reutilizar shareToken
    let shareToken = ride.shareToken;
    if (!shareToken) {
      shareToken = this.tokenService.generateShareToken(rideId);
      await this.rideRepo.update(rideId, { shareToken });
    }

    const baseUrl = process.env.APP_URL ?? 'https://going.com.ec';
    return {
      shareToken,
      shareUrl: `${baseUrl}/tracking?t=${shareToken}`,
      message: 'Comparte este link para que sigan tu viaje en tiempo real 📍',
    };
  }

  /**
   * Calificar al conductor tras finalizar el viaje
   * POST /rides/:rideId/rate
   * Body: { driverId, rating, thumbsUp, tags?, comment?, tip?, passengerName? }
   */
  @Post(':rideId/rate')
  @SkipThrottle()
  async rateDriver(
    @Param('rideId')         rideId: string,
    @CurrentUser()           user: AuthUser,
    @Body() body: {
      driverId:      string;
      rating:        number;
      thumbsUp:      boolean;
      tags?:         string[];
      comment?:      string;
      tip?:          number;
      passengerName?: string;
    },
  ) {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    const rating = Math.max(1, Math.min(5, Math.round(body.rating)));

    // Upsert — un pasajero solo puede calificar una vez por viaje
    await this.ratingModel.findOneAndUpdate(
      { driverId: body.driverId, passengerId: user.id, rideId },
      {
        driverId:      body.driverId,
        passengerId:   user.id,
        rideId,
        rating,
        comment:       body.comment ?? null,
        tags:          body.tags ?? [],
        passengerName: body.passengerName ?? null,
      },
      { upsert: true },
    );

    this.logger.log(`Passenger ${user.id} rated driver ${body.driverId} → ${rating}★ (ride ${rideId})`);

    return { ok: true, rideId, rating };
  }
}
