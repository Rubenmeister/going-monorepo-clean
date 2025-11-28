import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { CreatePaymentIntentUseCase } from '@myorg/domains/payment/application';
import { ConfirmPaymentUseCase } from '@myorg/domains/payment/application';
import { RequestRefundUseCase } from '@myorg/domains/payment/application'; // Añadir import
import { Trip } from '@myorg/domains/transport/core'; // Importar desde transport
import { MoneyVO } from '@myorg/shared/domain/money.vo'; // Añadir import
import { PaymentMethodVO } from '@myorg/domains/payment/core'; // Añadir import

interface CreatePaymentIntentDto {
  userId: string;
  tripId: string;
  amount: number; // En centavos o la unidad que uses
  currency: string;
  paymentMethod: {
    type: 'CARD' | 'WALLET';
    token: string;
  };
}

interface RequestRefundDto {
  transactionId: string;
  amount?: number; // En centavos
  reason?: string;
}

@Controller('payment')
export class PaymentController {
  constructor(
    private createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private confirmPaymentUseCase: ConfirmPaymentUseCase,
    private requestRefundUseCase: RequestRefundUseCase, // Añadir inyección
  ) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    const command = {
      userId: dto.userId,
      tripId: dto.tripId,
      amount: MoneyVO.fromCents(dto.amount), // Asumiendo que MoneyVO tiene este método
      paymentMethod: new PaymentMethodVO(dto.paymentMethod.type, dto.paymentMethod.token),
    };

    return this.createPaymentIntentUseCase.execute(command);
  }

  @Post('confirm')
  async confirmPayment(@Body('transactionId') transactionId: string) {
    const command = { transactionId };
    return this.confirmPaymentUseCase.execute(command);
  }

  // --- Añadir este método aquí ---
  @Post('refund')
  async requestRefund(@Body() dto: RequestRefundDto) {
    const command = {
      transactionId: dto.transactionId,
      amount: dto.amount ? MoneyVO.fromCents(dto.amount) : undefined,
      reason: dto.reason,
    };

    return this.requestRefundUseCase.execute(command);
  }
  // --- Fin del nuevo método ---

  // Endpoint para webhooks (Stripe, etc.)
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    // Lógica para manejar eventos de pago (éxito, fracaso, etc.)
    // Puede llamar a un caso de uso como `HandlePaymentWebhookUseCase`
  }
}