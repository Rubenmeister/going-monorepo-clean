import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  Wallet,
  WalletDocument,
  WalletTransaction,
  WalletTransactionDocument,
} from '../infrastructure/schemas/wallet.schema';

export interface WalletTxView {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  date: Date;
}

/**
 * WalletService — saldo prepago del pasajero (ledger).
 *
 * `credit` / `debit` son idempotentes por `ref`: si llega dos veces el mismo
 * paymentId (webhook reintentado) NO se duplica el movimiento.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private readonly txModel: Model<WalletTransactionDocument>,
  ) {}

  async getOrCreate(userId: string): Promise<WalletDocument> {
    const existing = await this.walletModel.findOne({ userId });
    if (existing) return existing;
    return this.walletModel.create({ userId, balance: 0, currency: 'USD' });
  }

  async getBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const w = await this.getOrCreate(userId);
    return { balance: w.balance, currency: w.currency };
  }

  async listTransactions(userId: string, limit = 20): Promise<WalletTxView[]> {
    const txs = await this.txModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return txs.map((t) => ({
      id: t.txId,
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: (t as any).createdAt,
    }));
  }

  /**
   * Acredita saldo. Idempotente por `ref` (ej. paymentId de la recarga).
   * Devuelve el saldo resultante.
   */
  async credit(userId: string, amount: number, description: string, ref?: string): Promise<{ balance: number }> {
    if (!(amount > 0)) throw new BadRequestException('El monto debe ser mayor a 0');

    if (ref) {
      const dup = await this.txModel.findOne({ ref });
      if (dup) {
        this.logger.warn(`credit idempotente: ref=${ref} ya procesado, se omite`);
        const w = await this.getOrCreate(userId);
        return { balance: w.balance };
      }
    }

    await this.getOrCreate(userId);
    const updated = await this.walletModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true },
    );
    const balance = updated?.balance ?? amount;

    await this.writeTx(userId, 'credit', amount, description, balance, ref);
    return { balance };
  }

  /**
   * Debita saldo (pago con wallet). Falla si no hay saldo suficiente.
   * Idempotente por `ref`.
   */
  async debit(userId: string, amount: number, description: string, ref?: string): Promise<{ balance: number }> {
    if (!(amount > 0)) throw new BadRequestException('El monto debe ser mayor a 0');

    if (ref) {
      const dup = await this.txModel.findOne({ ref });
      if (dup) {
        const w = await this.getOrCreate(userId);
        return { balance: w.balance };
      }
    }

    // Débito atómico condicionado a saldo suficiente.
    const updated = await this.walletModel.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    );
    if (!updated) throw new BadRequestException('Saldo insuficiente');

    await this.writeTx(userId, 'debit', amount, description, updated.balance, ref);
    return { balance: updated.balance };
  }

  private async writeTx(
    userId: string,
    type: 'credit' | 'debit',
    amount: number,
    description: string,
    balanceAfter: number,
    ref?: string,
  ): Promise<void> {
    try {
      await this.txModel.create({
        txId: randomUUID(),
        userId,
        type,
        amount,
        description,
        ref,
        balanceAfter,
      });
    } catch (e: any) {
      // Si chocó el índice único de `ref` (carrera de webhooks), no es error
      // real: el movimiento ya existe.
      if (e?.code !== 11000) throw e;
    }
  }
}
