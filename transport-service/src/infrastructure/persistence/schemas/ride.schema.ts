import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'rides' })
export class RideModelSchema {
  @Prop({ required: true }) userId: string;
  @Prop() driverId: string;
  @Prop({ type: Object }) pickupLocation: any;
  @Prop({ type: Object }) dropoffLocation: any;
  @Prop({ type: Object }) fare: any;
  @Prop({ type: Object }) finalFare: any;
  @Prop({ default: 'requested' }) status: string;
  @Prop({ default: () => new Date() }) requestedAt: Date;
  @Prop() acceptedAt: Date;
  @Prop() arrivedAt: Date;
  @Prop() startedAt: Date;
  @Prop() completedAt: Date;
  @Prop() durationSeconds: number;
  @Prop() distanceKm: number;
  @Prop() totalDistanceKm: number;     // distancia total de la ruta (para % progreso)
  @Prop() cancellationReason: string;
  @Prop() serviceType: string;          // suv | suv_xl | van | van_xl | minibus | bus
  @Prop() modalidad: string;            // compartido | privado
  @Prop() scheduledAt: Date;

  // ── Identidad y tokens ────────────────────────────────────────────────────
  @Prop() pickupToken: string;          // QR para verificar identidad al subir
  @Prop() deliveryToken: string;        // token generado al llegar, confirma entrega
  @Prop({ default: false }) pickupVerified: boolean;
  @Prop({ default: false }) deliveryVerified: boolean;

  // ── Paquetes ──────────────────────────────────────────────────────────────
  @Prop({ default: false }) isPackage: boolean;
  @Prop() packageDescription: string;
  @Prop() senderName: string;
  @Prop() recipientName: string;
  @Prop() recipientPhone: string;
  @Prop() deliveryPhotoUrl: string;     // foto de entrega en GCS

  // ── Link compartido ───────────────────────────────────────────────────────
  @Prop() shareToken: string;           // token base64 para tracking público

  // ── Pago ─────────────────────────────────────────────────────────────────
  @Prop() paymentRef: string;
  @Prop() paymentTxnId: string;
  @Prop() paymentEstimated: number;
}

export type RideDocument = RideModelSchema & Document;
export const RideSchema = SchemaFactory.createForClass(RideModelSchema);
