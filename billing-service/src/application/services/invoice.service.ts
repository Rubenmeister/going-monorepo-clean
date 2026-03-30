/**
 * Invoice Service
 * Business logic for invoice generation, PDF creation, and email delivery
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceStatus,
  InvoiceLanguage,
  InvoiceCalculations,
} from '../../domain/models/invoice.model';
import { InvoiceRepository } from '../../infrastructure/persistence/invoice.repository';
import { CreateInvoiceDto } from '../../api/dtos/create-invoice.dto';
import { UpdateInvoiceDto } from '../../api/dtos/update-invoice.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  /**
   * Create a new invoice
   * @param companyId Company ID
   * @param dto Invoice creation DTO
   * @returns Created invoice
   */
  async createInvoice(
    companyId: string,
    dto: CreateInvoiceDto
  ): Promise<Invoice> {
    try {
      // Validate required fields
      if (!dto.client || !dto.lineItems || dto.lineItems.length === 0) {
        throw new BadRequestException('Client and line items are required');
      }

      // Generate invoice number
      const year = new Date().getFullYear();
      const invoiceNumber =
        await this.invoiceRepository.generateNextInvoiceNumber(companyId, year);

      // Calculate totals and line item details
      const lineItems = dto.lineItems.map((item) => ({
        id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: item.quantity * item.unitPrice,
        taxAmount: Math.round(
          (item.quantity * item.unitPrice * item.taxRate) / 100
        ),
      }));

      const calculations = this.calculateInvoiceTotals(lineItems);

      // Calculate due date based on payment terms
      const issuedDate = new Date();
      const dueDate = this.calculateDueDate(issuedDate, dto.paymentTerms);

      const invoice: Partial<Invoice> = {
        invoiceNumber,
        companyId,
        clientId: dto.clientId,
        company: dto.company as any,
        client: dto.client as any,
        issueDate: issuedDate,
        dueDate,
        lineItems: lineItems as any,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        discountAmount: dto.discountAmount || 0,
        total: calculations.total - (dto.discountAmount || 0),
        amountDue: calculations.total - (dto.discountAmount || 0),
        amountPaid: 0,
        status: 'DRAFT',
        paymentStatus: 'NOT_PAID',
        paymentTerms: dto.paymentTerms,
        language: dto.language || 'en',
        currency: dto.currency || 'EUR',
        notes: dto.notes,
        terms: dto.terms,
        bankDetails: dto.bankDetails as any,
      };

      const created = await this.invoiceRepository.create(invoice);
      this.logger.log(
        `Invoice ${invoiceNumber} created for company ${companyId}`
      );

      return created;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error}`);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param companyId Company ID
   * @param invoiceId Invoice ID
   * @returns Invoice data
   */
  async getInvoice(companyId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * List invoices for a company
   * @param companyId Company ID
   * @param filters Query filters
   * @returns Array of invoices
   */
  async listInvoices(
    companyId: string,
    filters?: {
      status?: InvoiceStatus;
      clientId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<Invoice[]> {
    const { invoices } = await this.invoiceRepository.list(
      companyId,
      filters || {}
    );
    return invoices;
  }

  /**
   * Update invoice
   * @param companyId Company ID
   * @param invoiceId Invoice ID
   * @param dto Update DTO
   * @returns Updated invoice
   */
  async updateInvoice(
    companyId: string,
    invoiceId: string,
    dto: UpdateInvoiceDto
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      return null;
    }

    const updates: Partial<Invoice> = {};

    if (dto.client) {
      updates.client = dto.client as any;
    }

    // Recalculate totals if line items changed
    if (dto.lineItems) {
      const lineItems = dto.lineItems.map((item) => ({
        id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: item.quantity * item.unitPrice,
        taxAmount: Math.round(
          (item.quantity * item.unitPrice * item.taxRate) / 100
        ),
      }));

      const calculations = this.calculateInvoiceTotals(lineItems);
      updates.lineItems = lineItems as any;
      updates.subtotal = calculations.subtotal;
      updates.taxAmount = calculations.taxAmount;
      updates.total =
        calculations.total -
        (dto.discountAmount || invoice.discountAmount || 0);
    }

    if (dto.paymentTerms) {
      updates.paymentTerms = dto.paymentTerms;
      updates.dueDate = this.calculateDueDate(
        invoice.issueDate,
        dto.paymentTerms
      );
    }

    if (dto.discountAmount !== undefined) {
      updates.discountAmount = dto.discountAmount;
      if (updates.total) {
        updates.total -= dto.discountAmount;
      } else {
        updates.total =
          invoice.total - invoice.discountAmount + dto.discountAmount;
      }
    }

    if (dto.notes !== undefined) {
      updates.notes = dto.notes;
    }

    if (dto.terms !== undefined) {
      updates.terms = dto.terms;
    }

    updates.amountDue =
      (updates.total || invoice.total) - (invoice.amountPaid || 0);

    const updated = await this.invoiceRepository.update(
      invoiceId,
      companyId,
      updates
    );
    this.logger.log(`Invoice ${invoiceId} updated`);

    return updated;
  }

  /**
   * Issue an invoice (change status to ISSUED)
   * @param companyId Company ID
   * @param invoiceId Invoice ID
   * @returns Updated invoice
   */
  async issueInvoice(
    companyId: string,
    invoiceId: string
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      return null;
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be issued');
    }

    const updated = await this.invoiceRepository.updateStatus(
      invoiceId,
      companyId,
      'ISSUED'
    );
    this.logger.log(`Invoice ${invoiceId} issued`);

    return updated;
  }

  /**
   * Record a payment towards an invoice
   * @param companyId Company ID
   * @param invoiceId Invoice ID
   * @param amount Amount paid in cents
   * @param method Payment method
   * @param reference Payment reference
   * @returns Updated invoice
   */
  async recordPayment(
    companyId: string,
    invoiceId: string,
    amount: number,
    method: string,
    reference?: string
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      return null;
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const newAmountPaid = (invoice.amountPaid || 0) + amount;

    if (newAmountPaid > invoice.total) {
      throw new BadRequestException('Payment exceeds invoice total');
    }

    const updated = await this.invoiceRepository.recordPayment(
      invoiceId,
      companyId,
      {
        amount,
        method,
        reference,
      }
    );

    this.logger.log(
      `Payment of ${amount} cents recorded for invoice ${invoiceId}`
    );

    return updated;
  }

  /**
   * Calculate invoice totals from line items
   * @param lineItems Line items
   * @returns Calculated totals
   */
  calculateInvoiceTotals(lineItems: any[]): {
    subtotal: number;
    taxAmount: number;
    total: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;

    lineItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = (itemTotal * item.taxRate) / 100;

      subtotal += itemTotal;
      taxAmount += itemTax;
    });

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }

  /**
   * Calculate due date from payment terms
   * @param issuedDate Invoice issued date
   * @param paymentTerms Payment terms code
   * @returns Due date
   */
  private calculateDueDate(issuedDate: Date, paymentTerms: string): Date {
    const dueDate = new Date(issuedDate);

    switch (paymentTerms) {
      case 'NET_30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'NET_60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'NET_90':
        dueDate.setDate(dueDate.getDate() + 90);
        break;
      case 'DUE_ON_RECEIPT':
        // Same as issue date
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30); // Default to NET_30
    }

    return dueDate;
  }

  /**
   * Check if invoice is overdue
   * @param invoice Invoice to check
   * @returns True if overdue
   */
  isOverdue(invoice: Invoice): boolean {
    if (invoice.status === InvoiceStatus.PAID) {
      return false;
    }

    return new Date() > invoice.dueDate;
  }

  /**
   * Get amount due (total - paid)
   * @param invoice Invoice
   * @returns Amount due in cents
   */
  getAmountDue(invoice: Invoice): number {
    return invoice.total - invoice.amountPaid;
  }

  /**
   * Get number of days until invoice is due
   * @param invoice Invoice
   * @returns Days until due (negative if overdue)
   */
  getDaysUntilDue(invoice: Invoice): number {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }
}
