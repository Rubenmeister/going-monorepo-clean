import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Favorito corporativo (ruta/lugar guardado) por usuario dentro de una empresa.
 * Antes vivía solo en localStorage del navegador (no sincronizaba entre
 * dispositivos); ahora se persiste por usuario+empresa.
 *
 * El favorito del cliente tiene varios campos (serviceType, origin, destination,
 * vehicleType, city, category, notes…). Para no acoplar el schema a cada uno y
 * no perder ninguno, guardamos el resto en `payload` (flexible). `name` queda
 * arriba para orden/legibilidad.
 */
@Schema({ timestamps: true, collection: 'corporate_favorites' })
export class CorporateFavoriteSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  /** Resto de campos del favorito (serviceType, origin, destination, etc.). */
  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;
}

export const CorporateFavoriteSchemaDefinition =
  SchemaFactory.createForClass(CorporateFavoriteSchema);

CorporateFavoriteSchemaDefinition.index({ companyId: 1, userId: 1 });
