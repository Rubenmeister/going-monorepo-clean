/**
 * Invoice Schema - MongoDB
 * Stores invoices with support for multi-currency, multi-language, and complex tax rules
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  taxAmount: number;
}

interface CompanyInfo {
  name: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email: string;
  taxId: string;
  website?: string;
}

interface ClientInfo {
  name: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email: string;
  taxId?: string;
}

interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
  iban?: string;
}

interface Payment {
  id: string;
  amount: number;
  date: Date;
  method: string;
  reference?: string;
}

@Schema({
  collection: 'invoices',
  timestamps: true,
  indexes: [
    { invoiceNumber: 1, companyId: 1, isUnique: true },
    { companyId: 1, createdAt: -1 },
    { clientId: 1, companyId: 1 },
    { status: 1, companyId: 1 },
    { dueDate: 1, status: 1 },
    { issuedDate: 1, companyId: 1 },
  ],
})
export class InvoiceSchema extends Document {
  @Prop({ required: true, index: true })
  invoiceNumber: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ type: Object, required: true })
  company: CompanyInfo;

  @Prop({ type: Object, required: true })
  client: ClientInfo;

  @Prop({ type: [Object], required: true })
  lineItems: LineItem[];

  @Prop({
    required: true,
    enum: [
      'DRAFT',
      'ISSUED',
      'SENT',
      'VIEWED',
      'PAID',
      'OVERDUE',
      'CANCELLED',
      'REFUNDED',
    ],
  })
  status: string;

  @Prop({
    required: true,
    enum: ['NOT_PAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'],
  })
  paymentStatus: string;

  @Prop({ required: true })
  subtotal: number; // in cents

  @Prop({ required: true })
  taxAmount: number; // in cents

  @Prop({ default: 0 })
  discountAmount?: number; // in cents

  @Prop({ required: true })
  total: number; // in cents

  @Prop({ default: 0 })
  amountPaid?: number; // in cents

  @Prop({ default: 0 })
  amountDue?: number; // in cents

  @Prop({ required: true })
  issuedDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: () => new Date() })
  createdAt?: Date;

  @Prop({ default: () => new Date() })
  updatedAt?: Date;

  @Prop()
  paidAt?: Date;

  @Prop({ required: true, enum: ['es', 'en'] })
  language: string;

  @Prop({ required: true, enum: ['EUR', 'USD', 'GBP'] })
  currency: string;

  @Prop({ type: Object })
  bankDetails?: BankDetails;

  @Prop()
  notes?: string;

  @Prop()
  terms?: string;

  @Prop({ type: [Object] })
  payments?: Payment[];

  @Prop({
    required: true,
    enum: ['NET_30', 'NET_60', 'NET_90', 'DUE_ON_RECEIPT'],
  })
  paymentTerms: string;

  @Prop({ type: Object })
  taxSummary?: Record<string, { rate: number; amount: number }>;

  @Prop()
  sendAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  viewedAt?: Date;

  @Prop({ default: false })
  emailSent?: boolean;

  @Prop()
  pdfPath?: string;

  @Prop()
  tags?: string[];
}

export const InvoiceSchemaDefinition =
  SchemaFactory.createForClass(InvoiceSchema);

// Ensure compound index on invoiceNumber and companyId
InvoiceSchemaDefinition.index(
  { invoiceNumber: 1, companyId: 1 },
  { unique: true }
);
