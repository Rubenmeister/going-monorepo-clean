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
import { UUID } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser, Public } from '../domain/ports';
import { ParcelMatchingOrchestrator } from '../infrastructure/services/parcel-matching-orchestrator.service';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
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
    @Inject(IParcelRepository)
    private readonly parcelRepository: IParcelRepository,
  ) {}

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

    // Always use the authenticated user's ID — never trust client-provided userId
    const result = await this.createParcelUseCase.execute({
      ...dto,
      userId: user.id,
    });

    // Arrancar ciclo de matching (fire-and-forget, no bloquea response).
    // El orchestrator maneja retries + fallback internamente.
    if (
      typeof dto.origin.latitude === 'number' &&
      typeof dto.origin.longitude === 'number'
    ) {
      this.orchestrator.start({
        parcelId: result.id,
        userId: user.id,
        origin: {
          lat: dto.origin.latitude,
          lng: dto.origin.longitude,
          address: dto.origin.address,
        },
        destination: { address: dto.destination.address },
        price: dto.price.amount,
        // vehicleTypes se puede derivar del tipo de paquete en el futuro.
      });
    }

    return result;
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
    return result;
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

    // Verify OTP
    if (primitives.otpPin !== body.otpPin) {
      throw new BadRequestException('Código OTP incorrecto');
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
