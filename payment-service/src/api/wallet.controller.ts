import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { WalletService } from '../application/wallet.service';
import { RechargeService } from '../application/recharge.service';

/**
 * Wallet del pasajero.
 * - GET /payments/wallet/:userId/balance
 * - GET /payments/wallet/:userId/transactions?limit=20
 *
 * Solo el propio usuario (o admin/staff) puede leer su wallet.
 * (La recarga llegará en un slice aparte: POST /payments/wallet/recharge.)
 */
@Controller('payments/wallet')
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly rechargeSvc: RechargeService,
  ) {}

  @Get(':userId/balance')
  @UseGuards(AuthGuard('jwt'))
  async getBalance(
    @Param('userId') userId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    this.assertSelfOrAdmin(userId, currentUserId, roles);
    return this.wallet.getBalance(userId);
  }

  @Get(':userId/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getTransactions(
    @Param('userId') userId: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    this.assertSelfOrAdmin(userId, currentUserId, roles);
    const n = Math.min(Math.max(parseInt(limit ?? '20', 10) || 20, 1), 100);
    return { transactions: await this.wallet.listTransactions(userId, n) };
  }

  /**
   * POST /payments/wallet/recharge — inicia una recarga. Devuelve el checkout
   * (Datafast) o el link (DeUna) para que el usuario pague.
   */
  @Post('recharge')
  @UseGuards(AuthGuard('jwt'))
  async recharge(
    @Body() body: { amount: number; method: 'datafast' | 'deuna' },
    @CurrentUser('userId') userId: string,
  ) {
    return this.rechargeSvc.create(userId, Number(body?.amount), body?.method);
  }

  /**
   * POST /payments/wallet/recharge/:ref/confirm — confirma el resultado del
   * pago consultando al gateway y acredita el saldo (idempotente).
   */
  @Post('recharge/:ref/confirm')
  @UseGuards(AuthGuard('jwt'))
  async confirmRecharge(
    @Param('ref') ref: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.rechargeSvc.confirm(userId, ref);
  }

  private assertSelfOrAdmin(userId: string, currentUserId: string, roles: string[] = []) {
    const isAdmin = roles.includes('admin') || roles.includes('staff');
    if (userId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('No autorizado para ver este wallet');
    }
  }
}
