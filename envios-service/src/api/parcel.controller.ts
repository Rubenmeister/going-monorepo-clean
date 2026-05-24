import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
  TrackParcelUseCase,
  AssignParcelUseCase,
  CancelParcelUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { UUID, MoneyDto } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser, Public } from '../domain/ports';
import { ParcelMatchingOrchestrator } from '../infrastructure/services/parcel-matching-orchestrator.service';
import { PaymentIntentService } from '../infrastructure/services/payment-intent.service';
import { SmsService } from '../infrastructure/services/sms.service';
import { TrackingClientService } from '../infrastructure/services/tracking-client.service';
import { TransportClientService } from '../infrastructure/services/transport-client.service';
import { PricingService, classifyRoute } from 'pricing';
import {
  IsNumber,
  IsDefined,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsIn,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
}

class QuoteGeoPoint {
  @IsNumber() @IsLatitude() lat: number;
  @IsNumber() @IsLongitude() lng: number;
}

/** Cuerpo de POST /parcels/quote — cotización autoritativa antes de crear. */
export class QuoteEnvioDto {
  // @IsDefined necesario: @ValidateNested solo valida estructura INTERNA si
  // el campo existe — undefined pasa el pipe sin error y luego origin.lat
  // explota con TypeError 500 (mismo patrón del bug SOS, audit sistémico).
  @IsDefined({ message: 'origin is required (shape: { lat, lng })' })
  @ValidateNested() @Type(() => QuoteGeoPoint) origin: QuoteGeoPoint;
  @IsDefined({ message: 'destination is required (shape: { lat, lng })' })
  @ValidateNested() @Type(() => QuoteGeoPoint) destination: QuoteGeoPoint;
  @IsOptional() @IsIn(['small', 'medium', 'large']) packageSize?: 'small' | 'medium' | 'large';
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @IsOptional() @IsBoolean() isOverVolume?: boolean;
}

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelController {
  private readonly logger = new Logger(ParcelController.name);

  constructor(
    private readonly createParcelUseCase: CreateParcelUseCase,
    private readonly findParcelsByUserUseCase: FindParcelsByUserUseCase,
    private readonly trackParcelUseCase: TrackParcelUseCase,
    private readonly assignParcelUseCase: AssignParcelUseCase,
    private readonly cancelParcelUseCase: CancelParcelUseCase,
    private readonly orchestrator: ParcelMatchingOrchestrator,
    private readonly paymentIntent: PaymentIntentService,
    private readonly sms: SmsService,
    private readonly trackingClient: TrackingClientService,
    private readonly transportClient: TransportClientService,
    private readonly pricing: PricingService,
    @Inject(IParcelRepository)
    private readonly parcelRepository: IParcelRepository,
  ) {}

  /**
   * Cotización autoritativa de un envío (precio que se cobrará). El cliente la
   * usa para mostrar el precio antes de crear. Misma fuente que usa create.
   * POST /api/parcels/quote
   */
  @Post('quote')
  @Public()
  @HttpCode(HttpStatus.OK)
  async quote(@Body() dto: QuoteEnvioDto): Promise<any> {
    const q = this.pricing.quoteEnvio({
      originLat: dto.origin.lat,
      originLng: dto.origin.lng,
      destLat: dto.destination.lat,
      destLng: dto.destination.lng,
      packageSize: dto.packageSize,
      weightKg: dto.weightKg,
      isOverVolume: dto.isOverVolume,
    });
    if (!q.inCoverage) {
      throw new BadRequestException(
        'El origen o destino está fuera de la zona de cobertura de envíos',
      );
    }
    return {
      price: q.price,
      currency: q.currency,
      isIntercity: q.isIntercity,
      routeClass: q.routeClass,
      originCity: q.originCity,
      destinationCity: q.destinationCity,
      weightKg: q.weightKg,
    };
  }

  /**
   * Create a new parcel delivery request.
   * POST /api/parcels
   *
   * Tras crear el parcel, arranca el ciclo de matching con reintentos +
   * fallback. No bloquea al caller.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createParcel(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateParcelDto,
  ): Promise<any> {
    // Normalize mobile's flat format to nested format if needed
    if (!dto.origin && dto.from) {
      dto.origin = {
        address: dto.from,
        latitude: dto.fromLatitude,
        longitude: dto.fromLongitude,
        city: '',
        country: '',
      };
    }
    if (!dto.destination && dto.to) {
      dto.destination = {
        address: dto.to,
        latitude: dto.toLatitude,
        longitude: dto.toLongitude,
        city: '',
        country: '',
      };
    }

    // Default city/country si las apps los omiten (city y country son
    // opcionales en el DTO desde el move a 2-tier pricing). Asumimos
    // Ecuador y dejamos city derivable luego.
    if (dto.origin) {
      dto.origin.city = dto.origin.city ?? '';
      dto.origin.country = dto.origin.country ?? 'Ecuador';
    }
    if (dto.destination) {
      dto.destination.city = dto.destination.city ?? '';
      dto.destination.country = dto.destination.country ?? 'Ecuador';
    }

    // ── Precio autoritativo server-side: se recomputa con libs/pricing y se
    // sobre-escribe lo que mande el cliente (no se confía en el precio del app).
    const oLat = dto.origin?.latitude;
    const oLng = dto.origin?.longitude;
    const dLat = dto.destination?.latitude;
    const dLng = dto.destination?.longitude;
    if (
      typeof oLat !== 'number' ||
      typeof oLng !== 'number' ||
      typeof dLat !== 'number' ||
      typeof dLng !== 'number'
    ) {
      throw new BadRequestException(
        'Se requieren coordenadas de origen y destino para cotizar el envío',
      );
    }
    const quote = this.pricing.quoteEnvio({
      originLat: oLat,
      originLng: oLng,
      destLat: dLat,
      destLng: dLng,
      packageSize: dto.packageSize,
      weightKg: dto.weightKg,
      isOverVolume: dto.isOverVolume,
    });
    if (!quote.inCoverage) {
      throw new BadRequestException(
        'El origen o destino está fuera de la zona de cobertura de envíos',
      );
    }
    dto.price = { amount: quote.price, currency: 'USD' } as MoneyDto;

    // Always use the authenticated user's ID — never trust client-provided userId
    const result = await this.createParcelUseCase.execute({
      ...dto,
      userId: user.id,
    });

    const paymentMethod = dto.paymentMethod ?? 'cash';
    const payerRole = dto.payerRole ?? 'sender';

    // ── A) sender + card: crear payment intent y NO arrancar matching aún ────
    // El orchestrator se dispara cuando webhook confirme el pago.
    if (paymentMethod === 'card' && payerRole === 'sender') {
      const intent = await this.paymentIntent.createForParcel({
        userId: user.id,
        parcelId: result.id,
        amountUsd: dto.price.amount,
        description: `Envío Going #${result.trackingCode}`,
      });
      if (intent) {
        // Persistir intent details en parcel (por si webhook falla, podemos buscar)
        const findRes = await this.parcelRepository.findById(result.id as UUID);
        if (findRes.isOk() && findRes.value) {
          findRes.value.setPaymentIntent(intent.intentId, intent.paymentUrl);
          await this.parcelRepository.update(findRes.value);
        }
        return {
          ...result,
          paymentIntentId: intent.intentId,
          paymentUrl: intent.paymentUrl,
        };
      }
      // Si intent falló: parcel queda en pending_payment, frontend puede
      // reintentar con POST /parcels/:id/retry-payment (futura mejora).
      this.logger.warn(`Payment intent failed for parcel ${result.id}, no auto-retry yet`);
      return result;
    }

    // ── B/D) cash + (sender o recipient) y C) recipient + card: despacho ya.
    // Interurbano → intenta adjuntar a un viaje programado; si no, on-demand.
    if (
      typeof dto.origin?.latitude === 'number' &&
      typeof dto.origin?.longitude === 'number'
    ) {
      await this.dispatchParcel({
        parcelId: result.id,
        userId: user.id,
        originLat: dto.origin.latitude,
        originLng: dto.origin.longitude,
        originAddress: dto.origin.address,
        destLat: dto.destination?.latitude,
        destLng: dto.destination?.longitude,
        destAddress: dto.destination?.address ?? '',
        price: dto.price.amount,
        isOverVolume: dto.isOverVolume,
      });
    }

    return result;
  }

  /**
   * Despacha un envío. Si es INTERURBANO, intenta adjuntarlo a la salida de
   * carpooling programada más próxima con cupo (el paquete viaja con ese
   * conductor); si no hay cupo, o es urbano, cae a despacho on-demand (SUV/SUV XL).
   */
  private async dispatchParcel(args: {
    parcelId: string;
    userId: string;
    originLat: number;
    originLng: number;
    originAddress: string;
    destLat?: number;
    destLng?: number;
    destAddress: string;
    price: number;
    isOverVolume?: boolean;
  }): Promise<void> {
    if (typeof args.destLat === 'number' && typeof args.destLng === 'number') {
      const cls = classifyRoute(
        args.originLat,
        args.originLng,
        args.destLat,
        args.destLng,
      );
      if (cls.routeClass === 'intercity' && cls.originCity && cls.destinationCity) {
        const res = await this.transportClient.attachParcel({
          originCity: cls.originCity,
          destCity: cls.destinationCity,
          isOverVolume: args.isOverVolume,
        });
        if (res.attached && res.driverId) {
          try {
            await this.assignParcelUseCase.execute(
              args.parcelId as UUID,
              res.driverId as UUID,
            );
            this.logger.log(
              `Parcel ${args.parcelId} adjuntado al viaje programado ${res.scheduledTripId} (driver ${res.driverId})`,
            );
            return;
          } catch (e) {
            this.logger.warn(
              `No se pudo asignar parcel ${args.parcelId} al viaje programado: ${(e as Error).message}`,
            );
          }
        }
      }
    }

    // Fallback / urbano: despacho on-demand (solo SUV/SUV XL).
    this.orchestrator.start({
      parcelId: args.parcelId,
      userId: args.userId,
      origin: { lat: args.originLat, lng: args.originLng, address: args.originAddress },
      destination: { address: args.destAddress },
      price: args.price,
      vehicleTypes: ['suv', 'suv_xl'],
    });
  }

  /**
   * Webhook desde payment-service cuando una transaction asociada a un parcel
   * cambia de estado. Actualiza parcel.paymentStatus y, en caso A, transiciona
   * status='pending_payment' → 'pending' para que el orchestrator lo recoja.
   *
   * POST /api/parcels/webhooks/payment-event
   * Body: { parcelId, status: 'succeeded'|'failed' }
   *
   * NOTA: este endpoint es interno (servicio a servicio). En producción debe
   * validarse via Cloud Run service-to-service auth o un HMAC compartido.
   * Por ahora confiamos en VPC + IAM del cluster.
   */
  @Post('webhooks/payment-event')
  @Public()
  @HttpCode(HttpStatus.OK)
  async paymentEventWebhook(
    @Body() body: { parcelId: string; status: 'succeeded' | 'failed' },
  ): Promise<{ ok: true }> {
    const findRes = await this.parcelRepository.findById(body.parcelId as UUID);
    if (findRes.isErr() || !findRes.value) {
      this.logger.warn(`Webhook for unknown parcel ${body.parcelId}`);
      return { ok: true };
    }
    const parcel = findRes.value;
    const transition =
      body.status === 'succeeded'
        ? parcel.markPaymentConfirmed()
        : parcel.markPaymentFailed();

    if (transition.isErr()) {
      this.logger.warn(`payment webhook transition failed: ${transition.error.message}`);
      return { ok: true };
    }

    await this.parcelRepository.update(parcel);
    const primitives = parcel.toPrimitives();

    // Caso A: el sender pagó → ahora arrancamos matching.
    if (
      body.status === 'succeeded' &&
      primitives.paymentMethod === 'card' &&
      primitives.payerRole === 'sender' &&
      typeof primitives.origin?.latitude === 'number'
    ) {
      await this.dispatchParcel({
        parcelId: primitives.id,
        userId: primitives.userId,
        originLat: primitives.origin.latitude,
        originLng: primitives.origin.longitude,
        originAddress: primitives.origin.address,
        destLat: primitives.destination?.latitude,
        destLng: primitives.destination?.longitude,
        destAddress: primitives.destination?.address ?? '',
        price: primitives.price.amount,
      });
    }
    return { ok: true };
  }

  /**
   * Track a parcel by tracking code (public endpoint)
   * GET /api/parcels/track/:trackingCode
   */
  @Get('track/:trackingCode')
  @Public()
  async trackParcel(@Param('trackingCode') trackingCode: string): Promise<any> {
    return this.trackParcelUseCase.execute(trackingCode);
  }

  /**
   * Get parcels for authenticated user
   * GET /api/parcels/my
   */
  @Get('my')
  async getMyParcels(@CurrentUser() user: AuthUser): Promise<any> {
    return this.findParcelsByUserUseCase.execute(user.id as UUID);
  }

  /**
   * Get parcels by user ID (admin / internal use)
   * GET /api/parcels/user/:userId
   */
  @Get('user/:userId')
  async getParcelsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findParcelsByUserUseCase.execute(userId);
  }

  /**
   * Get a single parcel by ID
   * GET /api/parcels/:id
   */
  @Get(':id')
  async getParcelById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const result = await this.parcelRepository.findById(id);
    if (result.isErr()) throw new NotFoundException('Envío no encontrado');
    const parcel = result.value;
    if (!parcel) throw new NotFoundException('Envío no encontrado');
    const primitives = parcel.toPrimitives();
    const roles = user.roles ?? (user.role ? [user.role] : []);
    const isOwner = primitives.userId === user.id;
    const isDriver = primitives.driverId === user.id;
    const isAdmin = roles.includes('admin');
    if (!isOwner && !isDriver && !isAdmin) {
      throw new ForbiddenException('Sin permiso para ver este envío');
    }

    // Embed driver live location si el parcel está siendo recogido o en tránsito.
    // Para que el sender vea en su mapa dónde está su paquete sin un endpoint
    // separado. Best-effort: si tracking-service falla, devolvemos sin location.
    if (
      primitives.driverId &&
      (primitives.status === 'pickup_assigned' || primitives.status === 'in_transit')
    ) {
      const driverLocation = await this.trackingClient.getDriverLocation(
        primitives.driverId,
      );
      if (driverLocation) {
        return { ...primitives, driverLocation };
      }
    }
    return primitives;
  }

  /**
   * Accept a parcel (driver takes the delivery).
   * PATCH /api/parcels/:id/accept
   *
   * Requires role 'driver'. First-accept wins: si ya fue tomado,
   * devuelve 409 Conflict. Tras éxito, cancela el ciclo del orchestrator
   * para que no siga mandando notificaciones a otros conductores.
   */
  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptParcel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const roles = user.roles ?? (user.role ? [user.role] : []);
    if (!roles.includes('driver') && !roles.includes('admin')) {
      throw new ForbiddenException('Sólo conductores pueden aceptar envíos');
    }
    const result = await this.assignParcelUseCase.execute(id, user.id as UUID);
    // Parar el ciclo — otros drivers no deben seguir recibiendo pushes.
    this.orchestrator.cancel(id);

    // Caso C: receptor + card. Tras matchear driver, creamos payment intent
    // y enviamos link SMS al receptor para que pague antes de la entrega.
    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isOk() && findRes.value) {
      const parcel = findRes.value;
      const p = parcel.toPrimitives();
      if (
        p.paymentMethod === 'card' &&
        p.payerRole === 'recipient' &&
        p.recipientPhone
      ) {
        const intent = await this.paymentIntent.createForParcel({
          userId: p.userId,
          parcelId: p.id,
          amountUsd: p.price.amount,
          description: `Envío Going contra pago — ${p.trackingCode}`,
        });
        if (intent?.paymentUrl) {
          parcel.setPaymentIntent(intent.intentId, intent.paymentUrl);
          await this.parcelRepository.update(parcel);
          // Best-effort: SMS no bloquea — si Twilio falla, driver puede llamar manual.
          this.sms
            .sendPaymentLink({
              toPhone: p.recipientPhone,
              recipientName: p.recipientName,
              amountUsd: p.price.amount,
              paymentLinkUrl: intent.paymentUrl,
            })
            .catch((e) => this.logger.warn(`SMS payment link failed: ${e?.message}`));
        }
      }
    }
    return result;
  }

  /**
   * Driver confirma haber recibido el pago en efectivo del SENDER al recoger
   * el paquete. Solo válido para escenario B (sender + cash).
   *
   * PATCH /api/parcels/:id/confirm-cash-pickup
   *
   * Tras esto, paymentStatus='paid_at_pickup' y el driver puede llamar a
   * markInTransit (que valida este flag). Idempotente.
   */
  @Patch(':id/confirm-cash-pickup')
  @HttpCode(HttpStatus.OK)
  async confirmCashAtPickup(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isErr() || !findRes.value) {
      throw new NotFoundException('Envío no encontrado');
    }
    const parcel = findRes.value;
    const result = parcel.confirmCash(user.id as UUID, 'pickup');
    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }
    await this.parcelRepository.update(parcel);
    this.logger.log(`Parcel ${id} cash confirmed at pickup by driver ${user.id}`);
    return { id, paymentStatus: parcel.paymentStatus };
  }

  /**
   * Driver confirma haber recibido el pago en efectivo del RECEPTOR al entregar.
   * Solo válido para escenario D (recipient + cash, "contra entrega").
   *
   * PATCH /api/parcels/:id/confirm-cash-delivery
   */
  @Patch(':id/confirm-cash-delivery')
  @HttpCode(HttpStatus.OK)
  async confirmCashAtDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isErr() || !findRes.value) {
      throw new NotFoundException('Envío no encontrado');
    }
    const parcel = findRes.value;
    const result = parcel.confirmCash(user.id as UUID, 'delivery');
    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }
    await this.parcelRepository.update(parcel);
    this.logger.log(`Parcel ${id} cash confirmed at delivery by driver ${user.id}`);
    return { id, paymentStatus: parcel.paymentStatus };
  }

  /**
   * Mark parcel as picked up (driver confirms recogida).
   * PATCH /api/parcels/:id/mark-in-transit
   *
   * Transición: pickup_assigned → in_transit
   * Solo el conductor asignado puede marcar la recogida.
   */
  @Patch(':id/mark-in-transit')
  @HttpCode(HttpStatus.OK)
  async markInTransit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isErr() || !findRes.value) {
      throw new NotFoundException('Envío no encontrado');
    }
    const parcel = findRes.value;
    const primitives = parcel.toPrimitives();

    if (primitives.driverId !== user.id) {
      throw new ForbiddenException('Solo el conductor asignado puede marcar la recogida');
    }

    const transitionResult = parcel.markAsInTransit();
    if (transitionResult.isErr()) {
      throw new ConflictException(transitionResult.error.message);
    }

    const updateResult = await this.parcelRepository.update(parcel);
    if (updateResult.isErr()) {
      throw new ConflictException(updateResult.error.message);
    }

    this.logger.log(`Parcel ${id} → in_transit (driver ${user.id})`);

    return {
      id: parcel.id,
      status: parcel.status,
      trackingCode: primitives.trackingCode,
    };
  }

  /**
   * Confirm delivery with OTP verification.
   * PATCH /api/parcels/:id/deliver
   *
   * Transición: in_transit → delivered
   * El conductor debe proporcionar el OTP PIN que tiene el destinatario.
   * Opcionalmente puede incluir una foto de evidencia (URL).
   */
  @Patch(':id/deliver')
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
    @Body() body: { otpPin: string; photoUrl?: string },
  ): Promise<any> {
    if (!body.otpPin) {
      throw new BadRequestException('El código OTP es requerido');
    }

    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isErr() || !findRes.value) {
      throw new NotFoundException('Envío no encontrado');
    }
    const parcel = findRes.value;
    const primitives = parcel.toPrimitives();

    if (primitives.driverId !== user.id) {
      throw new ForbiddenException('Solo el conductor asignado puede confirmar la entrega');
    }

    // Verify OTP con rate-limit (5 intentos → lockout 1h, anti brute-force).
    // verifyOtp muta el entity (incrementa attempts o resetea); persistimos
    // el cambio aunque el resultado sea fallido para que el contador no se pierda.
    const otpResult = parcel.verifyOtp(body.otpPin);
    if (otpResult.isErr()) {
      throw new ConflictException(otpResult.error.message);
    }
    await this.parcelRepository.update(parcel);
    if (!otpResult.value.ok) {
      if (otpResult.value.lockedUntil) {
        const minutesLeft = Math.ceil(
          (otpResult.value.lockedUntil.getTime() - Date.now()) / 60000,
        );
        throw new BadRequestException(
          `OTP bloqueado por demasiados intentos. Intenta de nuevo en ${minutesLeft} minutos.`,
        );
      }
      throw new BadRequestException(
        `Código OTP incorrecto. Intentos restantes: ${otpResult.value.attemptsLeft ?? 0}.`,
      );
    }

    const deliverResult = parcel.deliver();
    if (deliverResult.isErr()) {
      throw new ConflictException(deliverResult.error.message);
    }

    const updateResult = await this.parcelRepository.update(parcel);
    if (updateResult.isErr()) {
      throw new ConflictException(updateResult.error.message);
    }

    this.logger.log(`Parcel ${id} → delivered (driver ${user.id}, trackingCode=${primitives.trackingCode})`);

    return {
      id: parcel.id,
      status: parcel.status,
      trackingCode: primitives.trackingCode,
      deliveredAt: new Date(),
      photoUrl: body.photoUrl ?? null,
    };
  }

  /**
   * Cancel a parcel (user can cancel if not yet picked up).
   * PATCH /api/parcels/:id/cancel
   *
   * Allowed for: owner (reason='user_cancel'), admin ('admin').
   * Blocked if the parcel is already in_transit or delivered.
   * Cancela también el ciclo del orchestrator por si estaba activo.
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelParcel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const findRes = await this.parcelRepository.findById(id);
    if (findRes.isErr() || !findRes.value) {
      throw new NotFoundException('Envío no encontrado');
    }
    const primitives = findRes.value.toPrimitives();
    const roles = user.roles ?? (user.role ? [user.role] : []);
    const isOwner = primitives.userId === user.id;
    const isAdmin = roles.includes('admin');
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Sin permiso para cancelar este envío');
    }
    const result = await this.cancelParcelUseCase.execute(
      id,
      isAdmin ? 'admin' : 'user_cancel',
    );
    this.orchestrator.cancel(id);
    return result;
  }
}
