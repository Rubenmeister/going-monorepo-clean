import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  CorporatePaymentStatus,
  CorporatePaymentMethod,
} from '../domain/corporate-payment.entity';

export type CorporatePaymentDocument = CorporatePaymentModelSchema & Document;

@Schema({ timestamps: true })
export class CorporatePaymentModelSchema {
  @Prop({ required: true, unique: true })
  paymentId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  bookingId: string;

  @Prop()
  originalPaymentId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({
    required: true,
    enum: Object.values(CorporatePaymentMethod),
    index: true,
  })
  paymentMethod: CorporatePaymentMethod;

  @Prop({
    required: true,
    enum: Object.values(CorporatePaymentStatus),
    index: true,
  })
  status: CorporatePaymentStatus;

  @Prop()
  departmentId?: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop()
  approverUserId?: string;

  @Prop()
  approvalTimestamp?: Date;

  @Prop()
  transactionId?: string;

  @Prop()
  authorizationCode?: string;

  @Prop({ required: true })
  billedToCompany: boolean;

  @Prop()
  invoiceId?: string;

  @Prop()
  consolidatedInvoiceId?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  processedAt?: Date;

  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true, index: true })
  createdBy: string;
}

export const CorporatePaymentSchema = SchemaFactory.createForClass(
  CorporatePaymentModelSchema
);

// Indexes
CorporatePaymentSchema.index({ companyId: 1, createdAt: -1 });
CorporatePaymentSchema.index({ employeeId: 1, status: 1 });
CorporatePaymentSchema.index({ companyId: 1, status: 1 });
CorporatePaymentSchema.index({ bookingId: 1 });
CorporatePaymentSchema.index({ consolidatedInvoiceId: 1 });
CorporatePaymentSchema.index({ approverUserId: 1, status: 1 });
