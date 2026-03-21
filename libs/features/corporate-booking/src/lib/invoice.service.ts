import { Injectable, Logger } from '@nestjs/common';
import {
  IConsolidatedInvoice,
  InvoiceStatus,
} from '../interfaces/corporate-booking.interface';

/**
 * Invoice Service
 * Generates consolidated monthly invoices for companies
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  /**
   * Generate consolidated invoice for month
   */
  async generateInvoice(
    companyId: string,
    month: string
  ): Promise<IConsolidatedInvoice> {
    try {
      this.logger.log(`Generating invoice for ${companyId} - ${month}`);

      // Get all bookings for the month
      // const bookings = await this.getMonthlyBookings(companyId, month);

      // Calculate breakdown
      // const breakdown = this.calculateBreakdown(bookings);

      const invoice: IConsolidatedInvoice = {
        invoiceId: this.generateId(),
        companyId,
        invoiceNumber: `INV-${companyId}-${month.replace('-', '')}`,
        period: {
          startDate: this.getMonthStart(month),
          endDate: this.getMonthEnd(month),
          month,
        },
        bookingIds: [],
        totalAmount: { amount: 0, currency: 'USD' },
        breakdown: [],
        status: InvoiceStatus.DRAFT,
        dueDate: this.calculateDueDate(this.getMonthEnd(month)),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save invoice
      // await this.mongoService.insertOne('consolidated_invoices', invoice);

      return invoice;
    } catch (error) {
      this.logger.error(`Invoice generation failed:`, error);
      throw error;
    }
  }

  /**
   * Send invoice to company
   */
  async sendInvoice(invoiceId: string): Promise<void> {
    try {
      this.logger.log(`Sending invoice ${invoiceId}`);

      // Get invoice
      // const invoice = await this.getInvoice(invoiceId);

      // Generate PDF if needed
      // if (!invoice.pdfUrl) {
      //   invoice.pdfUrl = await this.generatePDF(invoice);
      // }

      // Send via email
      // await this.emailService.sendInvoice(invoice);

      // Update status
      // invoice.status = InvoiceStatus.SENT;
      // await this.mongoService.updateOne(
      //   'consolidated_invoices',
      //   { invoiceId },
      //   invoice,
      // );
    } catch (error) {
      this.logger.error(`Failed to send invoice:`, error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, paidDate?: Date): Promise<void> {
    try {
      this.logger.log(`Marking invoice ${invoiceId} as paid`);

      // Get invoice
      // const invoice = await this.getInvoice(invoiceId);

      // Update status
      // invoice.status = InvoiceStatus.PAID;
      // invoice.paidAt = paidDate || new Date();

      // Save
      // await this.mongoService.updateOne(
      //   'consolidated_invoices',
      //   { invoiceId },
      //   invoice,
      // );
    } catch (error) {
      this.logger.error(`Failed to mark as paid:`, error);
      throw error;
    }
  }

  /**
   * Get invoices for company
   */
  async getCompanyInvoices(companyId: string): Promise<IConsolidatedInvoice[]> {
    try {
      // const invoices = await this.mongoService.find(
      //   'consolidated_invoices',
      //   { companyId },
      // );
      // return invoices;

      return [];
    } catch (error) {
      this.logger.error(`Failed to get invoices:`, error);
      return [];
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<IConsolidatedInvoice | null> {
    try {
      // const invoice = await this.mongoService.findOne(
      //   'consolidated_invoices',
      //   { invoiceId },
      // );
      // return invoice || null;

      return null;
    } catch (error) {
      this.logger.error(`Failed to get invoice:`, error);
      return null;
    }
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getMonthStart(month: string): Date {
    return new Date(`${month}-01`);
  }

  private getMonthEnd(month: string): Date {
    const [year, monthNum] = month.split('-').map(Number);
    return new Date(year, monthNum, 0);
  }

  private calculateDueDate(invoiceDate: Date): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }
}
