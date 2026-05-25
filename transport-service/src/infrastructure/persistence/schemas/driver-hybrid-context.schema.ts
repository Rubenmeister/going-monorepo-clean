import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * DriverHybridContext schema — persiste el estado del modo híbrido
 * (driver que combina interurbano con carreras locales en destino).
 *
 * Indices:
 *  - id (unique)              — lookup directo
 *  - driverId + state (active subset)  — `findActiveByDriverId` rápido
 *  - state + restWindowStartsAt — query del cron Fase C (rest window)
 *  - state + nextLongTripStartTime — query del cron Fase C (return)
 *
 * Unicidad lógica: un driver solo puede tener UN contexto activo
 * (state != IDLE) a la vez. Se enforce con índice parcial — múltiples
 * docs con state=IDLE para el mismo driver son OK (histórico).
 *
 * Mapeo entidad ↔ doc: el repositorio hace `toDoc(entity)` y
 * `fromDoc(doc)` en cada save/find. Las fechas Date se serializan
 * naturalmente, los UUID viajan como strings.
 */
@Schema({ timestamps: true, collection: 'driver_hybrid_contexts' })
export class DriverHybridContextModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, index: true, type: String })
  state: string;

  @Prop({ type: String, default: null })
  outboundScheduledTripId: string | null;

  @Prop({ type: String, default: null })
  returnScheduledTripId: string | null;

  @Prop({ type: String, default: null })
  destinationCity: string | null;

  @Prop({ type: Date, default: null })
  nextLongTripStartTime: Date | null;

  @Prop({ type: Date, default: null })
  restWindowStartsAt: Date | null;

  @Prop({ type: Number, required: true, default: 45 })
  restBufferMinutes: number;

  @Prop({ type: String, default: null })
  lastTransitionReason: string | null;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type DriverHybridContextDocument = DriverHybridContextModelSchema &
  Document;

export const DriverHybridContextSchema = SchemaFactory.createForClass(
  DriverHybridContextModelSchema,
);

// Partial unique index: a driver can have only ONE active (non-IDLE) context.
// Acepta múltiples docs con state='IDLE' para el mismo driver (histórico).
DriverHybridContextSchema.index(
  { driverId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      state: {
        $in: [
          'LONG_TRIP_OUTBOUND',
          'AVAILABLE_LOCAL',
          'BLOCKED_REST',
          'LONG_TRIP_RETURN',
        ],
      },
    },
    name: 'driver_active_hybrid_unique',
  },
);

// Composite indexes para los queries del cron Fase C.
DriverHybridContextSchema.index(
  { state: 1, restWindowStartsAt: 1 },
  { name: 'state_rest_window' },
);
DriverHybridContextSchema.index(
  { state: 1, nextLongTripStartTime: 1 },
  { name: 'state_next_long_trip' },
);
