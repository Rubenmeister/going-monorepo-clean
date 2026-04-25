import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

/**
 * DriverBase schema. Almacena la base de operaciones del conductor
 * con un campo `location` GeoJSON Point para queries `$near`/`$geoWithin`
 * eficientes vía índice 2dsphere.
 *
 * Para sincronizar lat/lng (campos planos del dominio) con location
 * (GeoJSON Point), el repository hace el mapeo en cada save/update.
 */
@Schema({ timestamps: true, collection: 'driver_bases' })
export class DriverBaseModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true })
  lat: number;

  @Prop({ type: Number, required: true })
  lng: number;

  /**
   * GeoJSON Point — coordinates: [lng, lat]. Usado para queries geo
   * con $near. Mantener sincronizado con lat/lng en la entidad.
   */
  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
    index: '2dsphere',
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: Number, required: true, default: 5, min: 0, max: 50 })
  radiusKm: number;

  @Prop({ type: String })
  shiftStart?: string;

  @Prop({ type: String })
  shiftEnd?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isPrimary: boolean;

  @Prop({ type: Boolean, default: true, index: true })
  active: boolean;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type DriverBaseDocument = DriverBaseModelSchema & Document;
export const DriverBaseSchema = SchemaFactory.createForClass(DriverBaseModelSchema);
