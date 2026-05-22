import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Factura corporativa consolidada de un mes. Materializa el estado de cuenta
 * (getMonthlyStatement) en un documento persistente con número de factura,
 * vencimiento y estado de cobro. Idempotente por (companyId, month).
 */
@Schema({ timestamps: true, collection: 'corporate_invoices' })
export class CorporateInvoiceSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  /** Período facturado, YYYY-MM. */
  @Prop({ required: true, index: true })
  month: string;

  @Prop({ default: '' })
  invoiceNumber: string;

  @Prop({ default: 'USD' })
  currency: string;

  /** draft → issued → paid; overdue/void como estados terminales alternos. */
  @Prop({
    enum: ['draft', 'issued', 'paid', 'overdue', 'void'],
    default: 'issued',
    index: true,
  })
  status: string;

  @Prop({ default: 'monthly_consolidated' })
  billingMode: string;

  @Prop({ default: 'active' })
  contractStatus: string;

  @Prop({ default: 0 })
  tripCount: number;

  @Prop({ default: 0 })
  total: number;

  /** { employeeId: { count, amount } } */
  @Prop({ type: Object, default: {} })
  byEmployee: Record<string, unknown>;

  /** { serviceType: amount } */
  @Prop({ type: Object, default: {} })
  byServiceType: Record<string, unknown>;

  @Prop({ type: [Object], default: [] })
  lineItems: Record<string, unknown>[];

  @Prop({ default: null })
  dueDate: Date | null;

  @Prop({ default: null })
  issuedAt: Date | null;

  @Prop({ default: null })
  paidAt: Date | null;
}

export const CorporateInvoiceSchemaDefinition =
  SchemaFactory.createForClass(CorporateInvoiceSchema);

// Una sola factura por (empresa, mes): re-generar actualiza, no duplica.
CorporateInvoiceSchemaDefinition.index({ companyId: 1, month: 1 }, { unique: true });
