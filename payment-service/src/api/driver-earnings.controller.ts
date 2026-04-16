/**
 * DriverEarningsController
 *
 * Endpoints para que el conductor consulte sus ingresos y solicite retiros.
 * Montado en /drivers
 *
 * GET  /drivers/me/wallet            — Balance actual del conductor
 * GET  /drivers/me/earnings          — Resumen de ganancias por período
 * GET  /drivers/me/earnings/history  — Historial de transacciones paginado
 * POST /drivers/me/withdraw          — Solicitar retiro de fondos
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Inject,
  UnauthorizedException,
  Logger,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPaymentRepository, IPayoutRepository } from '../domain/ports';
import { v4 as uuidv4 } from 'uuid';

// ── Auth helpers (inline — payment-service no tiene módulo Auth propio) ─────

/** Guard JWT reutilizable en este servicio */
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** @CurrentUser(field?) — extrae el usuario del request */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    if (!user) return null;
    return field ? user[field] : user;
  },
);

// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_FEE_RATE = 0.15;   // 15 % comisión de plataforma

@Controller('drivers')
export class DriverEarningsController {
  private readonly logger = new Logger(DriverEarningsController.name);

  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepo: IPaymentRepository,

    @Inject(IPayoutRepository)
    private readonly payoutRepo: IPayoutRepository,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/wallet
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/wallet')
  @UseGuards(JwtAuthGuard)
  async getWallet(@CurrentUser('id') driverId: string) {
    if (!driverId) throw new UnauthorizedException();

    const [balance, pendingPayouts] = await Promise.all([
      this.payoutRepo.calculateDriverBalance(driverId),
      this.payoutRepo.findByDriver(driverId, 5),
    ]);

    const pending = pendingPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);

    return {
      driverId,
      availableBalance: Math.max(0, balance - pending),
      pendingWithdrawals: pending,
      totalBalance: balance,
      currency: 'USD',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/earnings?period=week|month|custom&from=&to=
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard)
  async getEarnings(
    @CurrentUser('id') driverId: string,
    @Query('period') period: string = 'week',
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    if (!driverId) throw new UnauthorizedException();

    const { from, to } = this.resolvePeriod(period, fromStr, toStr);

    const payments: any[] = await this.paymentRepo.findByDriver(driverId, 1000);

    // Filtrar por rango y solo completados
    const inRange = payments.filter((p) => {
      const d = new Date(p.completedAt ?? p.createdAt);
      return p.status === 'completed' && d >= from && d <= to;
    });

    const byMethod = { card: 0, cash: 0, wallet: 0 };
    let totalGross = 0;

    for (const p of inRange) {
      const net = p.driverAmount ?? p.amount * (1 - PLATFORM_FEE_RATE);
      totalGross += net;
      const method: string = p.paymentMethod ?? 'card';
      if (method in byMethod) byMethod[method as keyof typeof byMethod] += net;
    }

    const platformFees = inRange.reduce(
      (s, p) => s + (p.platformFee ?? p.amount * PLATFORM_FEE_RATE),
      0,
    );

    return {
      driverId,
      period: { from, to, label: period },
      summary: {
        totalEarnings:   +totalGross.toFixed(2),
        totalTrips:      inRange.length,
        platformFees:    +platformFees.toFixed(2),
        byPaymentMethod: {
          card:   +byMethod.card.toFixed(2),
          cash:   +byMethod.cash.toFixed(2),
          wallet: +byMethod.wallet.toFixed(2),
        },
        averagePerTrip:
          inRange.length > 0
            ? +(totalGross / inRange.length).toFixed(2)
            : 0,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/earnings/history?limit=20&page=1
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/earnings/history')
  @UseGuards(JwtAuthGuard)
  async getEarningsHistory(
    @CurrentUser('id') driverId: string,
    @Query('limit') limitStr: string = '20',
    @Query('page') pageStr: string = '1',
  ) {
    if (!driverId) throw new UnauthorizedException();

    const limit = Math.min(parseInt(limitStr, 10) || 20, 100);
    const page  = Math.max(parseInt(pageStr,  10) || 1,  1);

    const all: any[] = await this.paymentRepo.findByDriver(driverId, 500);
    const completed = all
      .filter((p) => p.status === 'completed')
      .sort((a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
      );

    const total = completed.length;
    const slice = completed.slice((page - 1) * limit, page * limit);

    return {
      data: slice.map((p) => ({
        paymentId:     p.id ?? p.paymentId,
        tripId:        p.tripId,
        amount:        +(p.driverAmount ?? p.amount * (1 - PLATFORM_FEE_RATE)).toFixed(2),
        grossAmount:   +p.amount.toFixed(2),
        paymentMethod: p.paymentMethod,
        completedAt:   p.completedAt ?? p.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  POST /drivers/me/withdraw
  //  Body: { amount: number, paymentMethod: 'bank_account'|'debit_card'|'wallet' }
  // ──────────────────────────────────────────────────────────────────────────

  @Post('me/withdraw')
  @UseGuards(JwtAuthGuard)
  async requestWithdraw(
    @CurrentUser('id') driverId: string,
    @Body() body: { amount: number; paymentMethod?: string },
  ) {
    if (!driverId) throw new UnauthorizedException();

    const { amount, paymentMethod = 'bank_account' } = body;

    if (!amount || amount <= 0) {
      throw new Error('El monto de retiro debe ser mayor a 0');
    }

    const balance = await this.payoutRepo.calculateDriverBalance(driverId);
    if (balance < amount) {
      return {
        success: false,
        message: `Saldo insuficiente. Disponible: $${balance.toFixed(2)}`,
        available: balance,
      };
    }

    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const fees  = +(amount * 0.01).toFixed(2);  // 1% comisión de retiro

    const payout = await this.payoutRepo.create({
      payoutId:        uuidv4(),
      driverId,
      amount,
      currency:        'USD',
      status:          'pending',
      paymentMethod,
      periodStart:     start,
      periodEnd:       now,
      transactionCount: 0,
      transactionIds:  [],
      fees,
      netAmount:       +(amount - fees).toFixed(2),
    });

    this.logger.log(`Driver ${driverId} requested withdrawal of $${amount}`);

    return {
      success:    true,
      payoutId:   payout.payoutId ?? payout.id,
      amount,
      netAmount:  +(amount - fees).toFixed(2),
      fees,
      status:     'pending',
      message:    'Solicitud de retiro recibida. Se procesará en 1-3 días hábiles.',
      requestedAt: now,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private resolvePeriod(
    period: string,
    fromStr?: string,
    toStr?: string,
  ): { from: Date; to: Date } {
    const now = new Date();
    if (period === 'custom' && fromStr && toStr) {
      return { from: new Date(fromStr), to: new Date(toStr) };
    }
    if (period === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    // default: 'week'
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from, to: now };
  }
}
