import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { PricingService, getClientSurchargeRate, type ClientSegment } from 'pricing';
import { EstimateFareDto } from './dtos/estimate-fare.dto';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
  /** Empresa corporativa del usuario (audit #29). Del JWT (server-trust). */
  companyId?: string;
}

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * POST /api/bookings/estimate
   *
   * Cotización rápida para preview UI. Aplica el recargo corporativo +25%
   * sobre transport/shared cuando el caller pertenece a una empresa
   * (clientSegment derivado del JWT, audit #29 — el cliente NO puede pasar
   * clientSegment en el body).
   *
   * Para envío/fixed/shared_route el +25% NO aplica: son tarifas fijas de
   * catálogo donde el segment está implícito en el precio acordado
   * (corporate-portal puede negociar tarifas separadas).
   *
   * Para cotizaciones autoritativas de rides (con surge dinámico de hora
   * pico / feriado / clima), preferir POST /search del transport-service —
   * este endpoint es solo preview rápido.
   */
  @Post('estimate')
  async estimateFare(
    @CurrentUser() user: AuthUser,
    @Body() body: EstimateFareDto,
  ): Promise<any> {
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    const clientSegment: ClientSegment = isAdmin
      ? (user.companyId ? 'corporate' : 'public')
      : (user.companyId ? 'corporate' : 'public');

    // calculate() devuelve el precio "limpio" — sin recargo corporativo.
    // El cast a any es necesario porque EstimateFareDto es un union shape
    // permisivo; PricingService valida los campos requeridos internamente.
    const base = this.pricingService.calculate(body as any);

    // Recargo corporativo solo para viajes dinámicos (no envíos/fixed).
    const SEGMENT_SURCHARGE_APPLIES: ReadonlyArray<EstimateFareDto['serviceType']> = [
      'transport',
      'shared',
    ];
    if (
      clientSegment === 'corporate' &&
      SEGMENT_SURCHARGE_APPLIES.includes(body.serviceType)
    ) {
      const rate = getClientSurchargeRate(clientSegment); // 0.25
      const adjusted = Math.round(base.subtotal * (1 + rate) * 100) / 100;
      const platformFee = Math.round(adjusted * 0.2 * 100) / 100;
      const providerAmount = Math.round((adjusted - platformFee) * 100) / 100;
      return {
        ...base,
        subtotal: adjusted,
        total: adjusted,
        platformFee,
        providerAmount,
        clientSegment,
        clientSurchargeRate: rate,
        breakdown: {
          ...base.breakdown,
          basePriceBeforeCorpSurcharge: base.subtotal,
          corpSurcharge: Math.round((adjusted - base.subtotal) * 100) / 100,
        },
      };
    }

    return { ...base, clientSegment, clientSurchargeRate: 0 };
  }

  /**
   * POST /api/bookings
   *
   * Server-side enforcement (audit #29):
   *  - `userId` siempre se toma del JWT (nunca del body)
   *  - Si el JWT lleva `companyId` (usuario corporativo), forzamos
   *    `companyId` + `clientSegment='corporate'` + `paymentMode='corporate_monthly'`
   *    en el booking — el cliente NO puede evitar el +25% omitiendo el flag,
   *    NI puede cobrarle a otra empresa inyectando un companyId ajeno.
   *  - B2C (sin companyId en JWT): no permitimos que el cliente se auto-marque
   *    corporate. Esos valores se anulan a defaults b2c.
   *  - Admins son la excepción: respetamos los valores del body para que ops
   *    pueda crear bookings de pruebas/correcciones manuales en cualquier
   *    contexto.
   *
   * El path corporate-portal pasa por corporate-service, que YA setea estos
   * campos correctamente; este enforcement protege llamadas directas al
   * booking-service desde mobile/web sin la mediación del portal.
   */
  @Post()
  async createBooking(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
  ): Promise<any> {
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    let companyId = dto.companyId;
    let clientSegment = dto.clientSegment;
    let paymentMode = dto.paymentMode;

    if (!isAdmin) {
      if (user.companyId) {
        // Usuario corporativo — forzar enforcement (ignorar lo que mande el body).
        companyId = user.companyId;
        clientSegment = 'corporate';
        paymentMode = paymentMode === 'immediate' ? 'immediate' : 'corporate_monthly';
      } else {
        // Usuario B2C — no permitimos que se auto-marquen corporate.
        companyId = undefined;
        clientSegment = 'b2c';
        paymentMode = 'immediate';
      }
    }

    return this.createBookingUseCase.execute({
      ...dto,
      userId: user.id,
      companyId,
      clientSegment,
      paymentMode,
    });
  }

  /**
   * GET /api/bookings/my
   * Returns bookings for the authenticated user
   */
  @Get('my')
  async getMyBookings(@CurrentUser() user: AuthUser): Promise<any> {
    return this.findBookingsByUserUseCase.execute(user.id as UUID);
  }

  /**
   * GET /api/bookings/admin?status=Y&page=N&limit=M
   * Lista TODAS las reservas (panel admin). Requiere rol admin. A diferencia
   * de GET /bookings (que exige companyId), este lista globalmente para el
   * Admin Dashboard. Declarado ANTES de :bookingId para no chocar con la ruta
   * por parámetro.
   */
  @Get('admin')
  async listAllForAdmin(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<any[]> {
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    if (!isAdmin) throw new ForbiddenException('Solo admin');
    const limitN = Math.max(1, Math.min(500, limit ? parseInt(limit, 10) : 100));
    const pageN = Math.max(1, page ? parseInt(page, 10) : 1);
    const skip = (pageN - 1) * limitN;
    const result = await this.bookingRepo.findAll({ status, limit: limitN, skip });
    if (result.isErr()) throw result.error;
    return result.value.map((b) => b.toPrimitives());
  }

  /**
   * GET /api/bookings?companyId=X&status=Y&page=N&limit=M
   * Reservas de una empresa (consumido por corporate-service para stats,
   * presupuesto y factura mensual). Requiere companyId.
   */
  @Get()
  async listByCompany(
    @CurrentUser() user: AuthUser,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<any[]> {
    // BOLA (auditoría B1 #38): antes cualquier usuario listaba las reservas de
    // CUALQUIER empresa pasando companyId en el query. Ahora un no-admin solo ve
    // las de SU empresa (companyId del JWT, ignorando el query). corporate-service
    // reenvía el JWT del usuario corporativo consultando su propia empresa, así que
    // no se rompe la facturación/stats. Admin puede consultar cualquier companyId.
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    if (!isAdmin) {
      if (!user.companyId) {
        throw new ForbiddenException('Solo cuentas corporativas o admin');
      }
      companyId = user.companyId;
    }
    if (!companyId) {
      throw new BadRequestException('companyId requerido');
    }
    const limitN = Math.max(1, Math.min(500, limit ? parseInt(limit, 10) : 100));
    const pageN = Math.max(1, page ? parseInt(page, 10) : 1);
    const skip = (pageN - 1) * limitN;
    const result = await this.bookingRepo.findByCompany(companyId as UUID, {
      status,
      limit: limitN,
      skip,
    });
    if (result.isErr()) throw result.error;
    return result.value.map((b) => b.toPrimitives());
  }

  /**
   * GET /api/bookings/user/:userId
   * Returns bookings for a specific user (admin / internal use)
   */
  @Get('user/:userId')
  async getBookingsByUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: UUID,
  ): Promise<any> {
    // IDOR (auditoría B1): antes cualquiera leía las reservas de cualquier user.
    // Solo admin puede consultar por userId arbitrario; el resto, las suyas.
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    if (!isAdmin && userId !== (user.id as UUID)) {
      throw new ForbiddenException('No autorizado');
    }
    return this.findBookingsByUserUseCase.execute(userId);
  }

  /**
   * Carga una reserva y verifica que el usuario autenticado tenga acceso
   * (auditoría B1 #27-31/#35/#38 — racimo IDOR/BOLA). Acceso = admin, dueño
   * (booking.userId === user.id), o miembro de la empresa dueña de la reserva
   * (booking.companyId === user.companyId, para portales corporativos). Antes
   * estos endpoints NO validaban nada → cualquier usuario leía/cancelaba/confirmaba
   * reservas ajenas por ID.
   */
  private async loadOwnedBooking(user: AuthUser, bookingId: UUID): Promise<any> {
    const result = await this.bookingRepo.findById(bookingId);
    if (result.isErr()) throw result.error;
    if (!result.value) throw new NotFoundException('Booking not found');
    const b = result.value.toPrimitives();
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    const owns = b.userId && b.userId === user.id;
    const sameCompany = b.companyId && user.companyId && b.companyId === user.companyId;
    if (!isAdmin && !owns && !sameCompany) {
      throw new ForbiddenException('No autorizado para esta reserva');
    }
    return b;
  }

  /**
   * GET /api/bookings/:bookingId
   * Returns a single booking by ID
   */
  @Get(':bookingId')
  async getBookingById(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: UUID,
  ): Promise<any> {
    return this.loadOwnedBooking(user, bookingId);
  }

  /**
   * PATCH /api/bookings/:bookingId/confirm
   */
  @Patch(':bookingId/confirm')
  async confirmBooking(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: UUID,
  ): Promise<any> {
    await this.loadOwnedBooking(user, bookingId);
    return this.confirmBookingUseCase.execute(bookingId);
  }

  /**
   * PATCH /api/bookings/:bookingId/cancel
   */
  @Patch(':bookingId/cancel')
  async cancelBooking(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: UUID,
  ): Promise<any> {
    await this.loadOwnedBooking(user, bookingId);
    return this.cancelBookingUseCase.execute(bookingId);
  }
}
