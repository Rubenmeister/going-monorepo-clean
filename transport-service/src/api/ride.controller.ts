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
import { DriverAssignmentService } from '../application/driver-assignment.service';
import { ConfigService } from '@nestjs/config';
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
    private readonly assignment: DriverAssignmentService,
    private readonly config: ConfigService,
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
      // Viaje de empresa: se marca 'corporate' (facturación mensual a la
      // empresa; el conductor cobra su 80% en el payout semanal igual).
      paymentMethod: isCorporate ? 'corporate' : undefined,
    });

    if (isFutureScheduled) {
      // RESERVA: NO se busca conductor ahora. El viaje queda anotado para
      // tal fecha/hora con el precio fijado. ScheduledRideDispatcherCron
      // disparará el matching ~1h antes (configurable). Devolvemos de una.
      this.logger.log(
        `[scheduled] ride ${ride.rideId} reservado para ${scheduledAt!.toISOString()} ` +
          `(lockedFare=${dto.lockedFare ?? 'n/a'}) — matching diferido`,
      );

      // PRELIMINAR (motor de agendas, privado intercity): si la ruta cae en un
      // corredor, asigna ya un conductor tentativo de las agendas para que el
      // pasajero lo vea al reservar. El definitivo se confirma el día anterior
      // (PrivateRideAssignmentCron); si se ausenta, se reasigna. Best-effort:
      // no bloquea la respuesta ni rompe la reserva si falla. Toggle opt-in.
      // (compartido no pasa por aquí — usa /scheduled-trips/reserve. Los urbanos
      // sin corredor los descarta resolveCorridorForCoords → no-op.)
      if (this.config.get<string>('PRIVATE_ASSIGNMENT_ENABLED') === 'true') {
        void this.assignPreliminaryDriver(ride, scheduledAt!, dto).catch((e) =>
          this.logger.warn(
            `[scheduled] preliminar ride ${ride.rideId} falló: ${(e as Error).message}`,
          ),
        );
      }
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
   * Asigna un conductor PRELIMINAR (motor de agendas) a un privado intercity
   * recién reservado, para que el pasajero lo vea de una. Si la ruta es urbana
   * o no cae en un corredor, no hace nada (va por realtime). Best-effort.
   */
  private async assignPreliminaryDriver(
    ride: any,
    scheduledAt: Date,
    dto: RequestRideDto,
  ): Promise<void> {
    const corridor = this.assignment.resolveCorridorForCoords(
      dto.pickupLatitude,
      dto.pickupLongitude,
      dto.dropoffLatitude,
      dto.dropoffLongitude,
    );
    if (!corridor) return; // urbano / sin corredor → realtime, sin preliminar
    const driver = await this.assignment.pickDriverForCorridor(
      corridor.corridorId,
      scheduledAt,
    );
    if (!driver) return; // nadie comprometido aún → el cron día-anterior reintenta
    await this.rideRepo.update(ride.rideId, {
      driverId: driver.driverId,
      preliminaryAssignedAt: new Date(),
    });
    this.logger.log(
      `[scheduled] ride ${ride.rideId} preliminar → ${driver.driverId} (${corridor.corridorId})`,
    );
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
    // FIX: los viajes que esperan conductor están en status 'requested' (default
    // del schema), NO 'pending' — nunca hay un ride en 'pending', así que este
    // endpoint devolvía SIEMPRE vacío (ni el worker ni la app-conductor veían los
    // viajes inmediatos por polling). El flujo real es requested → accepted.
    const rides = await this.rideRepo.findByStatus('requested', max, excludeDriverId);
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
   * GET /api/rides/mine/active — viaje activo del pasajero autenticado.
   * Lo consume el asistente de soporte ("¿dónde está mi conductor?" /
   * "¿cuánto falta?") con el JWT del propio usuario. Devuelve estado + ETA si
   * el conductor ya reporta ubicación (persistida por el gateway WS).
   * Va ANTES de `:rideId` (ruta de 2 segmentos, no colisiona, pero por claridad).
   */
  @Get('mine/active')
  @SkipThrottle()
  async getMyActiveRide(@CurrentUser() user: AuthUser): Promise<any> {
    const ride = await this.rideRepo.findActiveByUserId(user.id);
    if (!ride) return { hasActive: false };

    const status: string = ride.status;
    const statusText =
      (
        {
          requested: 'Buscando conductora o conductor disponible.',
          scheduled: 'Viaje reservado (programado). Aún no se asigna conductor.',
          accepted: 'Tu conductora o conductor aceptó y va en camino a recogerte.',
          arriving: 'Tu conductora o conductor está llegando al punto de recogida.',
          started: 'El viaje está en curso.',
        } as Record<string, string>
      )[status] ?? status;

    // ETA: usar la última posición persistida solo si es fresca (< 2 min).
    let eta: { seconds: number; text: string; distanceKm: number | null } | null = null;
    const fresh =
      ride.lastLocationAt &&
      Date.now() - new Date(ride.lastLocationAt).getTime() < 120_000;
    if (fresh && ride.lastDriverEtaSeconds != null) {
      const s = ride.lastDriverEtaSeconds as number;
      eta = {
        seconds: s,
        text: s < 60 ? 'menos de 1 minuto' : `${Math.round(s / 60)} min`,
        distanceKm:
          ride.lastDriverDistanceKm != null
            ? Math.round((ride.lastDriverDistanceKm as number) * 10) / 10
            : null,
      };
    }

    return {
      hasActive: true,
      ride: {
        rideId: String(ride._id),
        status,
        statusText,
        serviceType: ride.serviceType ?? null,
        modalidad: ride.modalidad ?? null,
        pickup: ride.pickupLocation?.address ?? null,
        dropoff: ride.dropoffLocation?.address ?? null,
        hasDriver: !!ride.driverId,
        scheduledAt: ride.scheduledAt ?? null,
        eta, // null si aún no hay ubicación del conductor o está rezagada
      },
    };
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
   * Dashcam — subida de un clip de evidencia (audio+video) disparado por un
   * evento de seguridad (SOS o RideCheck) durante un viaje activo.
   * POST /api/rides/:rideId/dashcam   (multipart: campo "clip")
   * Body opcional: { trigger?: 'sos'|'ridecheck'|'manual', lat?, lng? }
   *
   * El clip va a un bucket PRIVADO (sin URL pública). El acceso es por signed
   * URL generado por soporte/legal ante un incidente. Cumple LOPDP: finalidad
   * acotada (seguridad), acceso restringido, retención por lifecycle del bucket.
   *
   * Best-effort: NUNCA revienta al conductor si la subida falla.
   */
  @Post(':rideId/dashcam')
  @UseInterceptors(FileInterceptor('clip', {
    limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB — clip corto (~30 s)
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
      cb(ok ? null : new BadRequestException('Solo se aceptan clips de video o audio'), ok);
    },
  }))
  @HttpCode(HttpStatus.CREATED)
  async uploadDashcamClip(
    @CurrentUser() user: AuthUser,
    @Param('rideId') rideId: string,
    @UploadedFile() clip: Express.Multer.File | undefined,
    @Body() body: { trigger?: 'sos' | 'ridecheck' | 'manual'; lat?: number; lng?: number } = {},
  ): Promise<{ rideId: string; stored: boolean; ref?: string }> {
    if (!clip?.buffer) {
      throw new BadRequestException('Se requiere el campo "clip" con el archivo');
    }
    const trigger = ['sos', 'ridecheck', 'manual'].includes(body.trigger as string)
      ? body.trigger!
      : 'manual';
    const bucketName = process.env.GCS_BUCKET_DASHCAM ?? 'going-dashcam-evidence';
    const ext = clip.mimetype.startsWith('audio/') ? 'm4a' : 'mp4';
    const gcsPath = `rides/${rideId}/${trigger}_${Date.now()}.${ext}`;

    try {
      const storage = new Storage();
      const file = storage.bucket(bucketName).file(gcsPath);
      await file.save(clip.buffer, {
        resumable: false,
        public: false, // PRIVADO — nunca público
        metadata: {
          contentType: clip.mimetype,
          metadata: {
            rideId,
            driverId: user?.id ?? 'unknown',
            trigger,
            lat: body.lat != null ? String(body.lat) : '',
            lng: body.lng != null ? String(body.lng) : '',
            capturedAt: new Date().toISOString(),
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`[DASHCAM] upload fallo ride ${rideId}: ${err?.message}`);
      return { rideId, stored: false }; // best-effort: no bloquear al conductor
    }

    // Log para ops/auditoría (referencia, sin exponer el clip)
    this.logger.warn(
      `[DASHCAM] clip almacenado ride=${rideId} driver=${user?.id ?? 'unknown'} trigger=${trigger} ref=gs://${bucketName}/${gcsPath}`,
    );

    return { rideId, stored: true, ref: `gs://${bucketName}/${gcsPath}` };
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

    // Registrar la ganancia/comisión del conductor en payment-service (modelo
    // "comisión por cobrar"). Idempotente por tripId; sólo efectivo/wallet se
    // registran aquí — el digital (tarjeta/Datafast/DeUna) ya pasa por su
    // propio flujo de intent+webhook. No bloquea la finalización si falla.
    await this.recordDriverEarning(rideId, realAmount, dto);

    if (gatewayRef && txnId) {
      try {
        const captureResult = await this.paymentService.capture({
          gatewayRef,
          transactionId: txnId,
          amountUsd:     realAmount,
        });
        this.logger.log(`Viaje ${rideId} completado — pago ${captureResult.status} $${realAmount}`);
        this.rideRepo.update(rideId, { paymentCaptureStatus: 'captured' }).catch(() => {});
        return { ...completeResult, paymentStatus: captureResult.status, chargedAmount: realAmount };
      } catch (err: any) {
        this.logger.error(`Capture fallido para viaje ${rideId}: ${err?.message} — se marca para reconciliación`);
        // El viaje se completa igual (no bloqueamos al conductor), pero la
        // captura fallida queda PERSISTIDA para reintento/conciliación en vez
        // de perderse silenciosamente.
        this.rideRepo.update(rideId, {
          paymentCaptureStatus:   'failed',
          paymentCaptureFailedAt: new Date(),
        }).catch(() => {});
        return { ...completeResult, paymentStatus: 'capture_failed', chargedAmount: 0 };
      }
    }

    return completeResult;
  }

  /**
   * Registra la ganancia del conductor (y su comisión del 20%) llamando a
   * payment-service POST /payments/complete-ride. Idempotente por tripId allá.
   * Sólo cash/wallet: el digital se registra por su propio flujo intent+webhook.
   * Nunca lanza — si falla, se loguea y la finalización del viaje continúa.
   */
  private async recordDriverEarning(
    rideId: string,
    finalFare: number,
    dto: CompleteRideDto,
  ): Promise<void> {
    try {
      const ride: any = await this.rideRepo.findById(rideId);
      const method = (ride?.paymentMethod || 'cash') as string;
      // Efectivo/wallet/corporate se registran aquí. El digital (tarjeta/
      // Datafast/DeUna) pasa por su propio flujo de intent+webhook.
      // 'corporate' = la empresa se factura aparte; el conductor cobra su 80%
      // en el payout semanal igual.
      if (method !== 'cash' && method !== 'wallet' && method !== 'corporate') return;
      if (!ride?.driverId || !ride?.userId) {
        this.logger.warn(`No se registra ganancia de ${rideId}: faltan driverId/userId`);
        return;
      }
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007';
      const res = await fetch(`${paymentUrl}/payments/complete-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // S2S: payment valida X-Internal-Token (InternalServiceGuard, auditoría #1).
          'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        body: JSON.stringify({
          tripId:         rideId,
          passengerId:    ride.userId,
          driverId:       ride.driverId,
          finalFare,
          actualDistance: dto.distanceKm,
          actualDuration: dto.durationSeconds,
          paymentMethod:  method,
        }),
      });
      if (!res.ok) {
        this.logger.error(`Registro de ganancia ${rideId}: HTTP ${res.status}`);
      } else {
        this.logger.log(`Ganancia del conductor registrada para viaje ${rideId} (${method})`);
      }
    } catch (err: any) {
      this.logger.error(`Error registrando ganancia de ${rideId}: ${err?.message}`);
    }
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
   * Verificar identidad de recogida.
   * POST /api/rides/:rideId/verify-pickup
   *
   * Body: acepta cualquiera de las dos opciones:
   *   - { token: string } → QR largo (verificación criptográfica)
   *   - { code: string  } → PIN 6 dígitos (verificación manual — el común MVP)
   */
  @Post(':rideId/verify-pickup')
  async verifyPickup(
    @Param('rideId') rideId: string,
    @Body() body: { token?: string; code?: string },
  ): Promise<any> {
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    if (ride.pickupVerified) return { ok: true, alreadyVerified: true };

    const { token, code } = body || {};
    let verified = false;

    if (token) {
      const result = this.tokenService.verifyPickupToken(token);
      verified = result.valid && result.rideId === rideId;
    } else if (code) {
      // Comparación constant-time del PIN para evitar timing attacks.
      const a = Buffer.from(String(code));
      const b = Buffer.from(String((ride as any).pickupCode ?? ''));
      verified = a.length === b.length && a.length > 0 && require('crypto').timingSafeEqual(a, b);
    }

    if (!verified) {
      throw new BadRequestException('Código o token de recogida inválido');
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
      shareUrl: `${baseUrl}/tracking/live/${shareToken}`,
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
