import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { InvoiceRepository } from '../infrastructure/persistence/invoice.repository';
import { InternalServiceGuard } from '../infrastructure/auth/internal-service.guard';

// S2S only (auditoría #14): marca facturas PAID. payment-service manda el token.
@Controller('internal')
@UseGuards(InternalServiceGuard)
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
      await this.invoiceRepository.recordPayment(invoice._id!, invoice.companyId || 'internal', {
        amount,
        method,
        reference: transactionId,
      });
      this.logger.log(`Invoice ${invoice._id} updated to paid for tripId ${tripId}`);
      return { success: true, invoiceId: invoice._id };
    } catch (err) {
      this.logger.error(`Payment completion error: ${err}`);
      return { success: false };
    }
  }
}
