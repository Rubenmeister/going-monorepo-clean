import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InvoiceRepository } from '../infrastructure/persistence/invoice.repository';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  @Post('payment-completed')
  async onPaymentCompleted(@Body() body: {
    tripId: string;
    amount: number;
    method: string;
    transactionId?: string;
  }) {
    try {
      const { tripId, amount, method, transactionId } = body;
      const invoice = await this.invoiceRepository.findByTripId(tripId);
      if (!invoice) {
        this.logger.warn(`No invoice found for tripId: ${tripId}`);
        return { success: false, message: 'Invoice not found' };
      }
      // Use a fallback companyId since this is internal
      await this.invoiceRepository.recordPayment(invoice.id, invoice.companyId || 'internal', {
        amount,
        method,
        reference: transactionId,
      });
      this.logger.log(`Invoice ${invoice.id} updated to paid for tripId ${tripId}`);
      return { success: true, invoiceId: invoice.id };
    } catch (err) {
      this.logger.error(`Payment completion error: ${err}`);
      return { success: false };
    }
  }
}
