import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationChannelType } from '@going-monorepo-clean/domains-notification-core';

/**
 * OJO: sin `_id: false`. Ese flag es para SUBdocumentos; en una colección de
 * nivel superior impide que Mongoose genere el _id y todo save() revienta con
 * "document must have an _id before saving" — o sea, NINGUNA notificación se
 * podía persistir. Mismo defecto que tenía la colección de reservas.
 */
@Schema({ timestamps: true })
export class NotificationModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(NotificationChannelType),
  })
  channel: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    required: true,
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
  })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  /** Datos del canal/evento (teléfono destino, enlace, ids de referencia). */
  @Prop({ type: Object, default: {} })
  data?: Record<string, any>;
}

export type NotificationDocument = NotificationModelSchema & Document;
export const NotificationSchema = SchemaFactory.createForClass(
  NotificationModelSchema
);
