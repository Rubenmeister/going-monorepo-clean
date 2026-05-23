import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidentDocument = Document & IncidentEntity;

export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'false_alarm';
export type IncidentType   = 'medical' | 'accident' | 'robbery' | 'harassment' | 'vehicle_breakdown' | 'other';
export type IncidentChannel = 'mobile' | 'web' | 'whatsapp' | 'telegram' | 'voice' | 'api';

/**
 * Una alerta SOS de un cliente. La crea POST /sos y queda en este schema
 * hasta que un operador la marca como resolved/false_alarm.
 *
 * Campos clave para ops dashboard:
 *   - location: punto GeoJSON para query "incidentes a <5km" en mapa
 *   - status:    flujo open → in_progress → resolved
 *   - priority:  siempre RED para SOS (a futuro podríamos tener ORANGE para
 *                "no es emergencia pero necesito ayuda inmediata")
 */
@Schema({ timestamps: true, collection: 'incidents' })
export class IncidentEntity {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: String, enum: ['mobile', 'web', 'whatsapp', 'telegram', 'voice', 'api'], required: true })
  channel: IncidentChannel;

  @Prop({
    type: String,
    enum: ['medical', 'accident', 'robbery', 'harassment', 'vehicle_breakdown', 'other'],
    default: 'other',
  })
  emergencyType: IncidentType;

  @Prop({ type: String, default: 'RED' })
  priority: 'RED' | 'ORANGE';

  /** Descripción libre del cliente (opcional). Texto plano. */
  @Prop()
  description?: string;

  /**
   * Punto GeoJSON [lng, lat] — orden invertido respecto a {lat, lng}.
   * Index 2dsphere para queries geoespaciales en el ops dashboard.
   */
  @Prop({
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    required: true,
  })
  location: { type: 'Point'; coordinates: [number, number] };

  /** Accuracy del GPS reportado por el cliente, en metros. Opcional. */
  @Prop()
  accuracyM?: number;

  /**
   * rideId vinculado si la emergencia ocurrió durante un viaje activo.
   * Útil para que ops vea el conductor + ruta inmediatamente.
   */
  @Prop({ index: true })
  rideId?: string;

  /**
   * Estado actual del incidente. open=apenas creada, in_progress=alguien
   * lo está atendiendo, resolved=cerrado, false_alarm=cancelada por cliente
   * o reportada como falsa alarma por ops.
   */
  @Prop({
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'false_alarm'],
    default: 'open',
    index: true,
  })
  status: IncidentStatus;

  /** ID del operador que la atendió (Telegram chat_id o user-auth userId). */
  @Prop()
  operatorId?: string;

  /** Notas internas del operador. Append-only. */
  @Prop({
    type: [{
      operatorId: String,
      note:       String,
      timestamp:  Date,
    }],
    default: [],
  })
  notes: Array<{ operatorId: string; note: string; timestamp: Date }>;

  /** Indica que el cliente pidió que se llame al 911 desde el mobile. */
  @Prop({ default: false })
  emergencyDialerTriggered?: boolean;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop()
  resolvedAt?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(IncidentEntity);

// Indexes
IncidentSchema.index({ status: 1, createdAt: -1 });
IncidentSchema.index({ userId: 1, createdAt: -1 });
IncidentSchema.index({ location: '2dsphere' });
