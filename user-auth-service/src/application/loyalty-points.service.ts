import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserModelSchema } from '../infrastructure/user.schema';
import {
  LoyaltyTransaction,
  LoyaltyTransactionDocument,
} from '../infrastructure/loyalty-transaction.schema';

/**
 * LoyaltyPointsService — gestiona el saldo de puntos del Tipo B.
 *
 * Reglas:
 *   - 1 punto por USD pagado (floor).
 *   - 100 puntos = 1 USD de descuento.
 *   - Descuento máximo por viaje: 50% (enforced en FareEngine).
 *   - Sin vencimiento por ahora (iterar después: TTL de 12 meses).
 *
 * Atomicidad: usamos operadores de Mongo ($inc / $set) para evitar
 * race conditions entre redimir y ganar simultáneamente.
 */
@Injectable()
export class LoyaltyPointsService {
  private readonly logger = new Logger(LoyaltyPointsService.name);

  constructor(
    @InjectModel(UserModelSchema.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(LoyaltyTransaction.name)
    private readonly ledgerModel: Model<LoyaltyTransactionDocument>,
  ) {}

  async getBalance(userId: string): Promise<{
    userId: string;
    loyaltyPoints: number;
    usdEquivalent: number;
  }> {
    const doc = await this.userModel
      .findOne({ id: userId })
      .select('id loyaltyPoints')
      .lean()
      .exec();

    const points = (doc as any)?.loyaltyPoints ?? 0;
    return {
      userId,
      loyaltyPoints: points,
      usdEquivalent: Math.round((points / 100) * 100) / 100,
    };
  }

  /**
   * Acreditar puntos ganados. Idempotente por `referenceId` para evitar
   * acreditaciones duplicadas cuando los callers reintentan.
   */
  async award(
    userId: string,
    points: number,
    referenceId?: string,
  ): Promise<number> {
    if (points <= 0) return 0;
    if (!Number.isInteger(points)) {
      throw new BadRequestException('points debe ser entero');
    }

    // Idempotencia REAL (auditoría B1 #12/#16): si viene referenceId, se reclama
    // primero en el ledger con índice único. Si ya existe (reintento del caller),
    // el insert choca con duplicate-key (11000) → no se re-acredita. El ledger se
    // inserta ANTES del $inc para que dos requests concurrentes no doble-acrediten;
    // el segundo se corta aquí. (Sin referenceId no hay forma de deduplicar → se
    // acredita como antes; los callers de dinero SÍ mandan referenceId.)
    if (referenceId) {
      try {
        await this.ledgerModel.create({ userId, points, referenceId });
      } catch (e: any) {
        if (e?.code === 11000) {
          this.logger.log(
            `Award idempotente: ref=${referenceId} ya procesado, se ignora (+${points} a user ${userId})`,
          );
          return 0;
        }
        throw e;
      }
    }

    const res = await this.userModel
      .updateOne(
        { id: userId },
        {
          $inc: { loyaltyPoints: points },
          $set: { loyaltyPointsUpdatedAt: new Date() },
        },
      )
      .exec();

    if (res.matchedCount === 0) {
      // El usuario no existe: revertir la reclamación del ledger para no dejar
      // el referenceId "quemado" (permite reintento legítimo si el user aparece).
      if (referenceId) {
        await this.ledgerModel.deleteOne({ referenceId }).catch(() => undefined);
      }
      throw new BadRequestException(`Usuario ${userId} no encontrado`);
    }

    this.logger.log(
      `+${points} puntos → user ${userId}${referenceId ? ` (ref=${referenceId})` : ''}`,
    );

    return points;
  }

  /**
   * Consumir puntos. Valida que haya saldo suficiente con findOneAndUpdate
   * condicional (atomic) — si no hay saldo, retorna 0 consumidos.
   */
  async redeem(
    userId: string,
    points: number,
    referenceId?: string,
  ): Promise<{ redeemed: number; remainingBalance: number }> {
    if (points <= 0) return { redeemed: 0, remainingBalance: 0 };
    if (!Number.isInteger(points)) {
      throw new BadRequestException('points debe ser entero');
    }

    const updated = await this.userModel
      .findOneAndUpdate(
        { id: userId, loyaltyPoints: { $gte: points } },
        {
          $inc: { loyaltyPoints: -points },
          $set: { loyaltyPointsUpdatedAt: new Date() },
        },
        { new: true, projection: { loyaltyPoints: 1 } },
      )
      .exec();

    if (!updated) {
      // No match: saldo insuficiente o usuario inexistente.
      const current = await this.getBalance(userId);
      this.logger.warn(
        `Redeem fallido — user ${userId} saldo ${current.loyaltyPoints} < ${points} solicitados`,
      );
      return { redeemed: 0, remainingBalance: current.loyaltyPoints };
    }

    const remaining = (updated as any).loyaltyPoints ?? 0;
    this.logger.log(
      `-${points} puntos ← user ${userId} (remaining=${remaining}${referenceId ? `, ref=${referenceId}` : ''})`,
    );
    return { redeemed: points, remainingBalance: remaining };
  }
}
