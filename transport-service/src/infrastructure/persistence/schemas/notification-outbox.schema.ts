import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * NotificationOutbox — bandeja de salida transaccional para las notificaciones
 * IMPORTANTES del viaje (asignación día-anterior, apertura de canal, recordatorios).
 * Antes eran best-effort de un intento: si notifications-service tenía un blip, se
 * perdían en silencio (auditoría #16). Ahora se PERSISTEN y un cron las reintenta
 * con backoff; tras N intentos pasan a 'dead' (dead-letter) para inspección.
 */
@Schema({ collection: 'notification_outbox', timestamps: true })
export class NotificationOutboxModel {
  @Prop({ required: true, index: true }) userId: string;
  @Prop() type: string;
  @Prop() title: string;
  @Prop() body: string;
  @Prop({ type: Object, default: {} }) data: Record<string, unknown>;

  @Prop({ default: 0 }) attempts: number;
  @Prop({ index: true }) nextAttemptAt: Date;
  /** pending | sent | dead */
  @Prop({ default: 'pending', index: true }) status: string;
  @Prop() lastError: string;
}

export type NotificationOutboxDocument = NotificationOutboxModel & Document;
export const NotificationOutboxSchema = SchemaFactory.createForClass(NotificationOutboxModel);

// Barrido del cron: pendientes cuyo nextAttemptAt ya llegó.
NotificationOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
