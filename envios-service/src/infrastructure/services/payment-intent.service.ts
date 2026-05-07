import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CreateIntentResult {
  intentId: string;
  paymentUrl?: string;  // URL para que cliente pague (widget Datafast/DeUna)
  status: string;       // 'pending' | 'succeeded' | 'failed'
}

/**
 * PaymentIntentService — interfaz HTTP entre envios-service y payment-service.
 *
 * Por qué llamada HTTP en vez de import directo:
 *   payment-service es un microservicio separado con su propia base de datos
 *   (transactions collection). Llamar via HTTP mantiene el límite de bounded
 *   context y evita compartir Mongo connection strings entre servicios.
 *
 * Best-effort: si payment-service está caído, log y devolvemos null. El
 * caller decide si bloquear o continuar (para card debe bloquear; para cash
 * no se llama).
 */
@Injectable()
export class PaymentIntentService {
  private readonly logger = new Logger(PaymentIntentService.name);
  private readonly paymentServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    this.paymentServiceUrl =
      this.config.get<string>('PAYMENT_SERVICE_URL') ||
      'http://localhost:3007';
  }

  async createForParcel(args: {
    userId: string;
    parcelId: string;
    amountUsd: number;
    description: string;
  }): Promise<CreateIntentResult | null> {
    try {
      const response = await fetch(`${this.paymentServiceUrl}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: args.userId,
          referenceId: args.parcelId,
          price: {
            amount: Math.round(args.amountUsd * 100), // payment-service espera cents
            currency: 'USD',
          },
          // Idempotency: parcelId es UUID estable; reuse en retry da el mismo intent
          idempotencyKey: args.parcelId,
        }),
      });
      if (!response.ok) {
        this.logger.warn(
          `payment-service returned ${response.status} for parcel ${args.parcelId}`,
        );
        return null;
      }
      const json = (await response.json()) as any;
      return {
        intentId: json?.intentId ?? json?.id ?? json?.transactionId,
        paymentUrl: json?.paymentUrl ?? json?.qrCodeUrl ?? json?.qrPaymentLink,
        status: json?.status ?? 'pending',
      };
    } catch (e: any) {
      this.logger.warn(
        `Failed to create payment intent for parcel ${args.parcelId}: ${e?.message}`,
      );
      return null;
    }
  }
}
