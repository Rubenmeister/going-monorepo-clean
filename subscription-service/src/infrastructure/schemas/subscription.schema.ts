import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'subscriptions' })
export class SubscriptionSchema extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['basic', 'premium', 'corporate'], default: 'basic' })
  planId: string;

  @Prop({ required: true, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'active' })
  status: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  paymentReference?: string;

  @Prop({ default: false })
  trialUsed: boolean;
}

export const SubscriptionSchemaDefinition = SchemaFactory.createForClass(SubscriptionSchema);
