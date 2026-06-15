import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import type { ZoneKind } from '@going-monorepo-clean/domains-transport-core';

/**
 * Zone schema con índice 2dsphere sobre el polygon para queries geo
 * eficientes. El polygon se persiste como GeoJSON para que Mongo use
 * `$geoIntersects` con un Point al buscar zonas que contienen un punto.
 *
 * Nota sobre geometry: usamos `SchemaTypes.Mixed` porque Mongoose tiene
 * dificultades para inferir el tipo de un sub-objeto con un campo
 * llamado literalmente `type` (colisión con su sintaxis de schema). El
 * formato GeoJSON es validado por Mongo al guardar gracias al índice
 * 2dsphere — sólo acepta polígonos válidos.
 */
@Schema({ timestamps: true, collection: 'zones' })
export class ZoneModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    enum: ['service_area', 'no_service', 'priority', 'restricted', 'danger'],
    index: true,
  })
  kind: ZoneKind;

  /**
   * GeoJSON polygon — outer ring únicamente. Forma exacta:
   *   { type: 'Polygon', coordinates: [[[lng,lat], ..., [lng,lat]]] }
   * Mongo `$geoIntersects` requiere este formato y el índice 2dsphere
   * lo valida en cada insert/update.
   */
  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
    index: '2dsphere',
  })
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };

  @Prop({ type: Number, min: 0, max: 1 })
  surchargePct?: number;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Boolean, default: true, index: true })
  active: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type ZoneDocument = ZoneModelSchema & Document;
export const ZoneSchema = SchemaFactory.createForClass(ZoneModelSchema);
