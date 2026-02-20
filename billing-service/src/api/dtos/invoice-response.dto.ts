/**
 * Invoice Response DTO
 * Response data for invoice API endpoints
 */

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  companyId: string;
  clientId: string;
  company: {
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
  };
  client: {
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
  };
  lineItems: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
    taxAmount: number;
  }>;
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  issuedDate: Date;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
  language: string;
  currency: string;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    iban?: string;
  };
  notes?: string;
  terms?: string;
  paymentTerms: string;
  taxSummary?: Record<string, { rate: number; amount: number }>;
  sentAt?: Date;
  viewedAt?: Date;
  emailSent?: boolean;
  pdfPath?: string;
  tags?: string[];
}

export class InvoiceListResponseDto {
  invoices: InvoiceResponseDto[];
  total: number;
  limit: number;
  offset: number;
}

export class InvoiceStatsResponseDto {
  totalCount: number;
  draftCount: number;
  issuedCount: number;
  paidCount: number;
  overdueCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}
