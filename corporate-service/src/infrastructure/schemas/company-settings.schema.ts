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

  // ── Contrato / facturación ─────────────────────────────────────────────────
  /** 'monthly_consolidated' (diferido, factura mensual) | 'prepaid' (saldo). */
  @Prop({ default: 'monthly_consolidated' })
  billingMode: string;

  /** Día del mes en que se corta/emite la factura consolidada. */
  @Prop({ default: 1 })
  billingCycleDay: number;

  /** 'active' | 'suspended'. Contrato corporativo. */
  @Prop({ default: 'active' })
  contractStatus: string;

  /** Tope de crédito mensual del contrato (0 = sin tope explícito). */
  @Prop({ default: 0 })
  creditLimit: number;

  @Prop({ type: [String], default: [] })
  allowedServiceTypes: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CompanySettingsSchemaDefinition = SchemaFactory.createForClass(CompanySettingsSchema);
