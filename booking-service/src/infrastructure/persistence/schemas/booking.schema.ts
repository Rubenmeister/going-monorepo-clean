import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  BookingStatus,
  ServiceType,
} from '@going-monorepo-clean/domains-booking-core'; // Reemplaza con tu scope

// DTO anidado para el 'Money' Value Object
@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}

export type BookingDocument = BookingModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class BookingModelSchema {
  @Prop({ required: true, unique: true })
  id: string; // ID de la entidad de dominio

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  serviceId: string; // ID del Trip, Accommodation, o Tour

  @Prop({
    required: true,
    type: String,
    enum: ['transport', 'accommodation', 'tour', 'experience', 'parcel'],
  })
  serviceType: ServiceType;

  @Prop({
    required: false,
    type: String,
    enum: ['urban', 'intercity'],
  })
  bookingType?: 'urban' | 'intercity';

  @Prop({ required: true, type: MoneySchema })
  totalPrice: MoneySchema;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  status: BookingStatus;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  // ── Contexto corporativo (lo setea corporate-service al crear) ─────────
  @Prop({ index: true })
  companyId?: string;

  @Prop({
    type: String,
    enum: ['b2c', 'corporate'],
    default: 'b2c',
  })
  clientSegment?: 'b2c' | 'corporate';

  @Prop({
    type: String,
    enum: ['immediate', 'corporate_monthly'],
    default: 'immediate',
  })
  paymentMode?: 'immediate' | 'corporate_monthly';

  // ── Dispatch a ride real (BookingDispatcher cron) ─────────────────────
  // Cuando un booking transport con startDate futuro llega cerca de su
  // horario, el BookingDispatcher lo dispara como ride real en transport-
  // service y guarda el rideId aquí para idempotencia.
  @Prop({ sparse: true, index: true })
  triggeredRideId?: string;

  @Prop()
  triggeredAt?: Date;

  /**
   * Lock de despacho (auditoría B1 #13). El BookingDispatcher lo reclama de forma
   * ATÓMICA antes de crear el ride en transport, para que dos crones concurrentes
   * (multi-pod) no disparen dos rides del mismo booking. Se libera al fallar; si el
   * pod muere con el lock puesto, expira tras la ventana stale y otro pod reintenta.
   */
  @Prop()
  dispatchLockAt?: Date;

  /**
   * Clave de idempotencia de expansión de recurrentes (auditoría B1 #12) =
   * `${recurringTripId}:${startDateISO}`. Índice único sparse → re-expandir la
   * misma ocurrencia no crea un booking duplicado.
   */
  @Prop({ sparse: true, unique: true })
  recurrenceKey?: string;
}

export const BookingSchema = SchemaFactory.createForClass(BookingModelSchema);

// Single field indexes
BookingSchema.index({ status: 1 });
BookingSchema.index({ serviceType: 1 });

// Compound indexes for common queries
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ serviceId: 1, serviceType: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ startDate: 1, endDate: 1, status: 1 });

// Index for date range queries
BookingSchema.index({ createdAt: -1 });

// Corporate listings: query principal de corporate-service (stats, factura, etc.).
BookingSchema.index({ companyId: 1, createdAt: -1 });
BookingSchema.index({ companyId: 1, status: 1, createdAt: -1 });

// Dispatch query — BookingDispatcher cron usa este index para encontrar
// rápido los bookings transport listos para disparar como rides reales.
// Filtra por serviceType + status + startDate + triggeredRideId null.
// Partial index para minimizar tamaño (solo bookings sin ride disparado).
BookingSchema.index(
  { serviceType: 1, status: 1, startDate: 1 },
  {
    partialFilterExpression: {
      serviceType: 'transport',
      status: { $in: ['pending', 'confirmed'] },
      triggeredRideId: null,
    },
  },
);
