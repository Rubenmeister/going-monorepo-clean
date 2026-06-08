import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Solicitud de cotización corporativa (eventos, traslados grupales, etc.).
 * Antes era in-memory. El `id` string (quote_*) es el identificador público.
 */
@Schema({ collection: 'corporate_quotes' })
export class QuoteSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  requestedBy: string;

  @Prop({ default: 'transport' })
  serviceType: string;

  @Prop({ default: 0 })
  groupSize: number;

  @Prop({ required: true })
  eventName: string;

  @Prop()
  eventDate: string;

  @Prop()
  origin: string;

  @Prop()
  destination: string;

  @Prop()
  city: string;

  @Prop()
  estimatedBudget: number;

  @Prop()
  notes: string;

  @Prop({ required: true })
  contactName: string;

  @Prop()
  contactPhone: string;

  /** pending | quoted | accepted | rejected */
  @Prop({ default: 'pending' })
  status: string;

  @Prop({ required: true })
  createdAt: string;
}

export const QuoteSchemaDefinition = SchemaFactory.createForClass(QuoteSchema);
