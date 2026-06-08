import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Solicitud de clip de dashcam para un viaje. Antes era in-memory. Cuando
 * exista un dashcam-service real, este repo se cablea a él; por ahora persiste
 * la solicitud para no perderla en cold starts.
 */
@Schema({ collection: 'corporate_dashcam_clip_requests' })
export class DashcamClipRequestSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  tripId: string;

  @Prop({ required: true })
  requestedBy: string;

  /** pending | ready | denied */
  @Prop({ default: 'pending' })
  status: string;

  @Prop({ required: true })
  createdAt: string;
}

export const DashcamClipRequestSchemaDefinition =
  SchemaFactory.createForClass(DashcamClipRequestSchema);
