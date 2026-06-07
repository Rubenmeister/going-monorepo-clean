import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Wallet del pasajero — saldo prepago. El saldo se acredita por recargas
 * (Datafast/DeUna) y se debita al pagar viajes/envíos. Una fila por usuario.
 */
export type WalletDocument = Document & Wallet;

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, default: 0, min: 0 })
  balance: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

/**
 * Libro de movimientos del wallet. `ref` es la clave de idempotencia: cada
 * recarga/pago externo (paymentId) puede generar UN solo movimiento — el
 * índice único sparse evita doble acreditación si el webhook llega dos veces.
 */
export type WalletTransactionDocument = Document & WalletTransaction;

@Schema({ timestamps: true, collection: 'wallet_transactions' })
export class WalletTransaction {
  @Prop({ required: true, unique: true, index: true })
  txId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['credit', 'debit'] })
  type: 'credit' | 'debit';

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  description: string;

  /** Referencia externa para idempotencia (paymentId / rideId / parcelId). */
  @Prop({ index: true })
  ref?: string;

  @Prop({ required: true, default: 0 })
  balanceAfter: number;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
// Idempotencia: un mismo `ref` no puede acreditarse/debitarse dos veces.
WalletTransactionSchema.index({ ref: 1 }, { unique: true, sparse: true });
