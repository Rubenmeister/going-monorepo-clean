import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'points_of_interest' })
export class PoiSchema extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['restaurant', 'gas_station', 'hospital', 'police', 'atm', 'pharmacy', 'hotel', 'parking', 'landmark'] })
  category: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  rating?: number;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  icon?: string;

  @Prop()
  description?: string;
}

export const PoiSchemaDefinition = SchemaFactory.createForClass(PoiSchema);
PoiSchemaDefinition.index({ lat: 1, lng: 1 });
