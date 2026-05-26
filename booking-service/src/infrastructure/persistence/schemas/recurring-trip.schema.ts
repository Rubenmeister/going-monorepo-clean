/**
 * RecurringTrip — viaje corporativo que se repite automáticamente.
 *
 * Lo crea un usuario corporativo desde /empresas/panel/recurrentes y un
 * cron diario (RecurringTripExpanderService) lo expande a bookings concretos
 * para los próximos `EXPANSION_HORIZON_DAYS` días.
 *
 * Los bookings generados por el expander llevan `recurringTripId` para
 * idempotencia y trazabilidad: si el cron corre 2× para el mismo día, el
 * segundo intento NO crea un duplicado (existe un index unique parcial sobre
 * `recurringTripId + nextRunAt`).
 *
 * Una vez expandido a booking, el flujo continúa por el BookingDispatcher
 * normal (cuando se acerca startDate, dispara el ride en transport-service).
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecurringTripFrequency = 'daily' | 'weekly' | 'monthly';
export type RecurringTripServiceType = 'transport' | 'parcel';

@Schema({ _id: false })
class RecurringTripLocationSchema {
  @Prop({ required: true })
  address: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;
}

export type RecurringTripDocument = RecurringTripModelSchema & Document;

@Schema({ timestamps: true, collection: 'recurring_trips' })
export class RecurringTripModelSchema {
  /** ID de dominio (UUID). */
  @Prop({ required: true, unique: true, index: true })
  id: string;

  /** Quien creó la recurrencia (corporate user del JWT). */
  @Prop({ required: true, index: true })
  userId: string;

  /** Empresa propietaria (server-trust, del JWT). */
  @Prop({ required: true, index: true })
  companyId: string;

  /** Nombre legible para el ops/empleado. */
  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    type: String,
    enum: ['transport', 'parcel'],
  })
  serviceType: RecurringTripServiceType;

  @Prop({
    required: true,
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
  })
  frequency: RecurringTripFrequency;

  /** weekly: 0=domingo … 6=sábado. */
  @Prop({ type: [Number], default: undefined })
  weekDays?: number[];

  /** monthly: 1..28 (evitamos 29/30/31 por meses cortos). */
  @Prop()
  dayOfMonth?: number;

  /** HH:MM en zona Ecuador (UTC-5). */
  @Prop({ required: true })
  time: string;

  @Prop({ required: true, type: RecurringTripLocationSchema })
  origin: RecurringTripLocationSchema;

  @Prop({ required: true, type: RecurringTripLocationSchema })
  destination: RecurringTripLocationSchema;

  /** sedan | suv | van | minibus (solo transport). */
  @Prop()
  vehicleType?: string;

  @Prop()
  notes?: string;

  /** Si false, el expander lo ignora. */
  @Prop({ required: true, default: true })
  active: boolean;

  /**
   * Última fecha "ancla" que el expander generó para este recurrente.
   * Se compara con `now + horizon` para saber qué fechas faltan generar.
   * Set en cada tick del cron.
   */
  @Prop()
  lastExpandedAt?: Date;

  /**
   * Hasta qué fecha (inclusive) ya se generaron bookings. El cron solo
   * crea para fechas > este timestamp. Idempotencia primaria.
   */
  @Prop()
  expandedUntil?: Date;
}

export const RecurringTripSchema = SchemaFactory.createForClass(
  RecurringTripModelSchema,
);

// Query del expander cron: solo activos.
RecurringTripSchema.index({ active: 1, expandedUntil: 1 });
RecurringTripSchema.index({ companyId: 1, createdAt: -1 });
RecurringTripSchema.index({ userId: 1, createdAt: -1 });
