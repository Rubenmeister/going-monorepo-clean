import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * rate_fare_lists — tablas de tarifas VERSIONADAS y editables en vivo.
 *
 * UNA lista `active:true` sirve a `/price` en cada momento. Importar una nueva
 * (desde el Excel del founder) inserta otra versión con `active:false`; el panel
 * la activa cuando se valida (permite rollback). El motor de tarifas lee la
 * activa (con caché) → cambiar un precio = editar Atlas, sin deploy.
 *
 * NOTA: `private` es keyword de TS, por eso el campo se llama `privateFares`.
 */
@Schema({ timestamps: true, collection: 'rate_fare_lists' })
export class RateFareList {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, default: 1 }) version!: number;
  @Prop({ required: true, default: false, index: true }) active!: boolean;
  @Prop({ default: 'manual' }) source!: string; // 'excel-import' | 'manual'

  /** Tarifa por asiento compartido, clave "origen-destino" (minúsculas). */
  @Prop({ type: Object, default: {} }) shared!: Record<string, number>;
  /** Precio privado por par + vehículo (opcional). */
  @Prop({ type: Object, default: {} }) privateFares!: Record<string, Record<string, number>>;

  /** Config global (antes hardcodeada en RATES de pricing.service.ts). */
  @Prop({ type: Object }) rates?: Record<string, Record<string, number>>;
  @Prop({ type: Object }) zoneSurcharge?: Record<string, number>;
  @Prop() originSurcharge?: number;
  @Prop() frontSeatSurcharge?: number;
  @Prop({ type: Object }) tierMultiplier?: Record<string, number>;
  @Prop({ type: Object }) envioUrbanFixed?: Record<string, number>;
  @Prop({ type: [Object] }) envioIntercityTiers?: Array<{ maxKg: number; price: number }>;

  @Prop() importedAt?: Date;
  @Prop() createdBy?: string;
}

export type RateFareListDocument = RateFareList & Document;
export const RateFareListSchema = SchemaFactory.createForClass(RateFareList);
