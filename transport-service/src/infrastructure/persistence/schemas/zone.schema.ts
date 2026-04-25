import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { ZoneKind } from '@going-monorepo-clean/domains-transport-core';

/**
 * Zone schema con índice 2dsphere sobre el polygon para queries geo
 * eficientes. El polygon se persiste como GeoJSON para que Mongo use
 * `$geoIntersects` con un Point al buscar zonas que contienen un punto.
 */
@Schema({ timestamps: true, collection: 'zones' })
export class ZoneModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({
    required: true,
    enum: ['service_area', 'no_service', 'priority', 'restricted'],
    index: true,
  })
  kind: ZoneKind;

  /**
   * GeoJSON polygon — outer ring únicamente. Mongo `$geoIntersects`
   * requiere este formato exacto: `{ type: 'Polygon', coordinates: [[[lng,lat],...]] }`.
   */
  @Prop({
    required: true,
    type: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    },
    index: '2dsphere',
  })
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };

  @Prop({ type: Number, min: 0, max: 1 })
  surchargePct?: number;

  @Prop()
  notes?: string;

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ZoneDocument = ZoneModelSchema & Document;
export const ZoneSchema = SchemaFactory.createForClass(ZoneModelSchema);
