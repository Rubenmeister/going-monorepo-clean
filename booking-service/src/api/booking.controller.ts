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
import { PricingService } from 'pricing';

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
   * Calculates dynamic pricing / rates for local envíos, intercity envíos, or rides
   */
  @Post('estimate')
  async estimateFare(@Body() body: any): Promise<any> {
    return this.pricingService.calculate(body);
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
   * GET /api/bookings?companyId=X&status=Y&page=N&limit=M
   * Reservas de una empresa (consumido por corporate-service para stats,
   * presupuesto y factura mensual). Requiere companyId.
   */
  @Get()
  async listByCompany(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<any[]> {
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
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }

  /**
   * GET /api/bookings/:bookingId
   * Returns a single booking by ID
   */
  @Get(':bookingId')
  async getBookingById(@Param('bookingId') bookingId: UUID): Promise<any> {
    const result = await this.bookingRepo.findById(bookingId);
    if (result.isErr()) throw result.error;
    if (!result.value) throw new NotFoundException('Booking not found');
    return result.value.toPrimitives();
  }

  /**
   * PATCH /api/bookings/:bookingId/confirm
   */
  @Patch(':bookingId/confirm')
  async confirmBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.confirmBookingUseCase.execute(bookingId);
  }

  /**
   * PATCH /api/bookings/:bookingId/cancel
   */
  @Patch(':bookingId/cancel')
  async cancelBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.cancelBookingUseCase.execute(bookingId);
  }
}
