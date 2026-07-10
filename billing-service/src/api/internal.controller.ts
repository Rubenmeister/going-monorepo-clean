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

      // Validación de monto (auditoría Bloque 2 #2): no acreditar montos no
      // positivos ni no finitos. Antes se pasaba `amount` crudo a recordPayment.
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        this.logger.warn(`payment-completed monto inválido para tripId ${tripId}: ${amount}`);
        return { success: false, message: 'Invalid amount' };
      }

      const invoice = await this.invoiceRepository.findByTripId(tripId);
      if (!invoice) {
        this.logger.warn(`No invoice found for tripId: ${tripId}`);
        return { success: false, message: 'Invoice not found' };
      }
      if (!invoice.companyId) {
        this.logger.error(`Invoice ${invoice._id} sin companyId — no se acredita (scope inválido)`);
        return { success: false, message: 'Invoice missing company scope' };
      }

      const updated = await this.invoiceRepository.recordPayment(
        invoice._id!,
        invoice.companyId,
        { amount, method, reference: transactionId },
      );
      // #5: NO reportar éxito si la escritura falló (recordPayment devuelve null).
      if (!updated) {
        this.logger.error(`recordPayment falló para invoice ${invoice._id} (tripId ${tripId})`);
        return { success: false, message: 'Payment record failed' };
      }
      this.logger.log(`Invoice ${invoice._id} updated to paid for tripId ${tripId}`);
      return { success: true, invoiceId: invoice._id };
    } catch (err) {
      this.logger.error(`Payment completion error: ${err}`);
      return { success: false };
    }
  }
}
