import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpStatus,
  Inject,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IPaymentRepository, IPayoutRepository } from '../../domain/ports';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { CompleteRideUseCase } from '../../application/use-cases/complete-ride.use-case';
import { CreatePayoutUseCase } from '../../application/use-cases/create-payout.use-case';
import { TransportClient } from '../../application/transport-client.service';
import { JwtAuthGuard, CurrentUser } from '../driver-earnings.controller';
import { InternalServiceGuard } from '../../infrastructure/auth/internal-service.guard';

type AuthUser = { id: string; userId: string; roles: string[] };

/**
 * Payment Operations Controller
 * Handles payment and payout operations.
 *
 * Auth (auditoría #1 — antes 100% público, permitía fabricar pagos/payouts):
 *   - process            → JwtAuthGuard + ownership (el pasajero paga lo suyo)
 *   - complete-ride      → InternalServiceGuard (lo llama transport al cerrar viaje)
 *   - payout/create      → InternalServiceGuard (creación de payout = admin/interno)
 *   - GET por id/owner   → JwtAuthGuard + ownership (sin IDOR; admin ve todo)
 */
@Controller('payments')
export class PaymentOperationsController {
  constructor(
    private processPaymentUseCase: ProcessPaymentUseCase,
    private completeRideUseCase: CompleteRideUseCase,
    private createPayoutUseCase: CreatePayoutUseCase,
    private transportClient: TransportClient,
    @Inject(IPaymentRepository) private paymentRepository: IPaymentRepository,
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository
  ) {}

  /** Permite acceso solo al dueño del recurso o a un admin. */
  private assertSelfOrAdmin(user: AuthUser, ownerId: string | undefined): void {
    if (user?.id && ownerId && user.id === ownerId) return;
    if (user?.roles?.includes('admin')) return;
    throw new ForbiddenException('No autorizado para acceder a este recurso');
  }

  /** Para un pago: pueden verlo el pasajero, el conductor o un admin. */
  private assertParticipantOrAdmin(
    user: AuthUser,
    passengerId: string | undefined,
    driverId: string | undefined
  ): void {
    if (user?.roles?.includes('admin')) return;
    if (user?.id && (user.id === passengerId || user.id === driverId)) return;
    throw new ForbiddenException('No autorizado para acceder a este recurso');
  }

  @Post('process')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @CurrentUser() user: AuthUser,
    @Body()
    dto: {
      tripId: string;
      passengerId: string;
      driverId: string;
      amount: number;
      paymentMethod: 'card' | 'wallet' | 'cash';
      paymentMethodId?: string;
    }
  ) {
    // Server-trust (auditoría #1): el pasajero es SIEMPRE el usuario autenticado,
    // no se confía en dto.passengerId del body (evita cobrarle a otra persona).
    // Un admin sí puede procesar en nombre de otro (admin-dashboard).
    const isAdmin = user?.roles?.includes('admin');
    const passengerId = isAdmin && dto.passengerId ? dto.passengerId : user.id;

    // Anti-fabricación (auditoría B1 #1): NO se confía en amount ni driverId del
    // body. Para usuarios normales se consulta a transport el contexto AUTORITATIVO
    // del viaje (tarifa, conductor, pasajero real) y se DERIVA de ahí. Antes un
    // usuario cualquiera podía POST /payments/process con amount:9999 y driverId
    // arbitrario y crear un pago 'completed' acreditando 80% al driver elegido.
    let amount = dto.amount;
    let driverId = dto.driverId;
    if (!isAdmin) {
      if (!dto.tripId) {
        throw new BadRequestException('tripId requerido');
      }
      const ctx = await this.transportClient.getPaymentContext(dto.tripId);
      if (!ctx) {
        throw new BadRequestException('No se pudo validar el viaje para este pago');
      }
      // El usuario autenticado debe ser el pasajero real del viaje.
      if (ctx.passengerId !== user.id) {
        throw new ForbiddenException('No eres el pasajero de este viaje');
      }
      if (!ctx.driverId) {
        throw new BadRequestException('El viaje aún no tiene conductor asignado');
      }
      if (!(ctx.amount > 0)) {
        throw new BadRequestException('El viaje no tiene una tarifa válida');
      }
      // Fuente de verdad: transport. Se ignora lo que vino en el body.
      amount = ctx.amount;
      driverId = ctx.driverId;
    }

    const payment = await this.processPaymentUseCase.execute({
      ...dto,
      passengerId,
      amount,
      driverId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment processed successfully',
      data: payment,
    };
  }

  @Post('complete-ride')
  @UseGuards(InternalServiceGuard)
  async completeRide(
    @Body()
    dto: {
      tripId: string;
      passengerId: string;
      driverId: string;
      finalFare: number;
      actualDistance: number;
      actualDuration: number;
      paymentMethod: 'card' | 'wallet' | 'cash' | 'corporate';
      paymentMethodId?: string;
    }
  ) {
    const result = await this.completeRideUseCase.execute(dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Ride completed and payment processed',
      data: result,
    };
  }

  @Get('payment/:id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found',
        data: null,
      };
    }

    this.assertParticipantOrAdmin(user, (payment as any).passengerId, (payment as any).driverId);

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('trip/:tripId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByTrip(@CurrentUser() user: AuthUser, @Param('tripId') tripId: string) {
    const payment = await this.paymentRepository.findByTrip(tripId);

    if (!payment) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found for this trip',
        data: null,
      };
    }

    this.assertParticipantOrAdmin(user, (payment as any).passengerId, (payment as any).driverId);

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('passenger/:passengerId')
  @UseGuards(JwtAuthGuard)
  async getPassengerPayments(
    @CurrentUser() user: AuthUser,
    @Param('passengerId') passengerId: string
  ) {
    this.assertSelfOrAdmin(user, passengerId);
    const payments = await this.paymentRepository.findByPassenger(
      passengerId,
      50
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payments.length,
        payments,
      },
    };
  }

  @Get('driver/:driverId/payments')
  @UseGuards(JwtAuthGuard)
  async getDriverPayments(
    @CurrentUser() user: AuthUser,
    @Param('driverId') driverId: string
  ) {
    this.assertSelfOrAdmin(user, driverId);
    const payments = await this.paymentRepository.findByDriver(driverId, 50);

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payments.length,
        payments,
      },
    };
  }

  @Post('payout/create')
  @UseGuards(InternalServiceGuard)
  async createPayout(
    @Body()
    dto: {
      driverId: string;
      bankAccountId: string;
      paymentMethod: 'bank_account' | 'debit_card' | 'wallet';
    }
  ) {
    const payout = await this.createPayoutUseCase.execute(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payout created successfully',
      data: payout,
    };
  }

  @Get('payout/:id')
  @UseGuards(JwtAuthGuard)
  async getPayout(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const payout = await this.payoutRepository.findById(id);

    if (!payout) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payout not found',
        data: null,
      };
    }

    this.assertSelfOrAdmin(user, (payout as any).driverId);

    return {
      statusCode: HttpStatus.OK,
      data: payout,
    };
  }

  @Get('driver/:driverId/payouts')
  @UseGuards(JwtAuthGuard)
  async getDriverPayouts(
    @CurrentUser() user: AuthUser,
    @Param('driverId') driverId: string
  ) {
    this.assertSelfOrAdmin(user, driverId);
    const payouts = await this.payoutRepository.findByDriver(driverId, 50);

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payouts.length,
        payouts,
      },
    };
  }

  @Get('driver/:driverId/balance')
  @UseGuards(JwtAuthGuard)
  async getDriverBalance(
    @CurrentUser() user: AuthUser,
    @Param('driverId') driverId: string
  ) {
    this.assertSelfOrAdmin(user, driverId);
    const balance = await this.payoutRepository.calculateDriverBalance(
      driverId
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        driverId,
        totalEarned: balance,
        currency: 'USD',
      },
    };
  }
}
