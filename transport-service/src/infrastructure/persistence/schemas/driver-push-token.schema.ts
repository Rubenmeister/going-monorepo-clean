import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Almacena el Expo push token de cada conductor.
 * Cuando hay un match de viaje, transport-service busca el token en esta
 * collection y envía la notificación push directamente a https://exp.host/--/api/v2/push/send.
 *
 * Una entry por driverId (unique). Se hace upsert en cada login del driver app
 * para mantener el token vigente — Expo rota tokens ocasionalmente.
 */
@Schema({ timestamps: true, collection: 'driver_push_tokens' })
export class DriverPushTokenModelSchema {
  @Prop({ required: true, unique: true, index: true }) driverId: string;
  @Prop({ required: true }) expoPushToken: string;
  @Prop() platform: string; // 'ios' | 'android'
}

export type DriverPushTokenDocument = DriverPushTokenModelSchema & Document;
export const DriverPushTokenSchema = SchemaFactory.createForClass(
  DriverPushTokenModelSchema,
);
