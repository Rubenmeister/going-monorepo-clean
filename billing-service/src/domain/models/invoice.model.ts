/**
 * Invoice Domain Models
 * Core business entities for billing and invoice management
 */

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  NOT_PAID = 'not_paid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum InvoiceLanguage {
  SPANISH = 'es',
  ENGLISH = 'en',
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number; // In cents (e.g., 1000 = $10.00)
  taxRate: number; // 0-100 (e.g., 21 for 21% VAT)
  total: number; // quantity * unitPrice (before tax)
  taxAmount: number; // Calculated
}

export interface InvoiceAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
  state?: string;
}

export interface CompanyInfo {
  name: string;
  email: string;
  phone?: string;
  address: InvoiceAddress;
  taxId?: string;
  logo?: string; // Base64 or URL
  website?: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone?: string;
  address: InvoiceAddress;
  taxId?: string;
}

export interface PaymentTerms {
  daysUntilDue: number;
  description: string;
  late_fee_percent?: number;
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  companyId: string;
  clientId: string;

  // Parties
  company: CompanyInfo;
  client: ClientInfo;

  // Dates
  issueDate: Date;
  dueDate: Date;

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals (calculated)
  subtotal: number; // Sum of line items (before tax)
  taxAmount: number; // Sum of all taxes
  total: number; // subtotal + taxAmount

  // Discounts
  discountAmount?: number;
  discountDescription?: string;

  // Payments
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;

  // Payment terms
  paymentTerms: PaymentTerms;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    routingNumber?: string;
    bankName: string;
    swiftCode?: string;
    iban?: string;
  };

  // Additional
  notes?: string;
  terms?: string;
  language: InvoiceLanguage;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  paidAt?: Date;

  // Email
  emailSentTo?: string[];
  emailFailures?: Array<{
    email: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountDue: number;
  amountOverdue: number;
}

export interface InvoiceTemplate {
  _id?: string;
  companyId: string;
  name: string;
  language: InvoiceLanguage;
  html: string;
  css?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
