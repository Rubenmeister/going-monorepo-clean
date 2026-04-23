import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'company_settings' })
export class CompanySettingsSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  companyId: string;

  @Prop({ default: '' })
  companyName: string;

  @Prop({ default: '' })
  ruc: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  contactEmail: string;

  @Prop({ default: '' })
  contactPhone: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: 0 })
  monthlyBudget: number;

  @Prop({ default: true })
  requireApproval: boolean;

  @Prop({ default: 0 })
  approvalThreshold: number;

  @Prop({ type: [String], default: [] })
  allowedServiceTypes: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CompanySettingsSchemaDefinition = SchemaFactory.createForClass(CompanySettingsSchema);
