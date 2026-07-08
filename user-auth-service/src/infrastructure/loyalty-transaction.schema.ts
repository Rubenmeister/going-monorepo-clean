import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * LoyaltyTransaction — ledger de acreditaciones de puntos (auditoría B1 #12/#16).
 *
 * award() era idempotente SOLO en el comentario: hacía $inc ciego y el
 * referenceId solo se logueaba, así que un reintento del caller (payment-service
 * tras completar viaje) duplicaba puntos (= dinero: 100 pts = 1 USD). Este ledger
 * con índice ÚNICO sobre referenceId hace la idempotencia real: el segundo intento
 * choca con duplicate-key (11000) y no vuelve a acreditar. Además deja trail de auditoría.
 */
export type LoyaltyTransactionDocument = HydratedDocument<LoyaltyTransaction>;

@Schema({ collection: 'loyalty_transactions', timestamps: true })
export class LoyaltyTransaction {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  points: number;

  /** Clave de idempotencia (p.ej. paymentId/tripId). Único → dedup real. */
  @Prop({ required: true, unique: true })
  referenceId: string;
}

export const LoyaltyTransactionSchema =
  SchemaFactory.createForClass(LoyaltyTransaction);
