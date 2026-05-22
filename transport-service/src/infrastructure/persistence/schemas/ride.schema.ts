import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'rides' })
export class RideModelSchema {
  @Prop({ required: true }) userId: string;
  @Prop() driverId: string;
  @Prop() bookingId: string;            // Link to booking-service for status sync
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
  @Prop() cancellationTime: Date;
  /**
   * Conductores que rechazaron este viaje. Se usa para filtrar GET /rides/pending
   * y evitar que el mismo conductor vea de nuevo un viaje que ya rechazó (flood fix).
   */
  @Prop({ type: [String], default: [] }) rejectedByDriverIds: string[];
  @Prop() serviceType: string;          // suv | suv_xl | van | van_xl | minibus | bus
  @Prop() modalidad: string;            // compartido | privado
  @Prop() scheduledAt: Date;

  // ── Identidad y tokens ────────────────────────────────────────────────────
  @Prop() pickupToken: string;          // QR para verificar identidad al subir
  @Prop() deliveryToken: string;        // token generado al llegar, confirma entrega
  @Prop({ default: false }) pickupVerified: boolean;
  @Prop({ default: false }) deliveryVerified: boolean;

  // ── Entrega ───────────────────────────────────────────────────────────────
  // Los envíos como producto viven en envios-service (parcels). Aquí solo queda
  // la foto de entrega, que usa confirm-delivery (válido para pasajero o bulto).
  @Prop() deliveryPhotoUrl: string;     // foto de entrega en GCS

  // ── Link compartido ───────────────────────────────────────────────────────
  @Prop() shareToken: string;           // token base64 para tracking público

  // ── Pago ─────────────────────────────────────────────────────────────────
  @Prop() paymentRef: string;
  @Prop() paymentTxnId: string;
  @Prop() paymentEstimated: number;
  /**
   * Método de pago usado en este viaje: 'card' | 'transfer' | 'cash'.
   * 'cash' no pasa por el payment gateway — el conductor lo cobra físicamente
   * y confirma la recepción via cashConfirmed.
   */
  @Prop() paymentMethod: string;
  /**
   * true cuando el conductor confirmó haber recibido el efectivo del pasajero.
   * Solo relevante si paymentMethod === 'cash'.
   * Usado por el servicio de ganancias para contabilizar ingresos en efectivo.
   */
  @Prop({ default: false }) cashConfirmed: boolean;
}

export type RideDocument = RideModelSchema & Document;
export const RideSchema = SchemaFactory.createForClass(RideModelSchema);
