import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/ports';
import { PricingService, ServiceType } from '../pricing.service';
import { WalletService } from '../wallet.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process Payment Use Case
 * Processes payment for a completed trip/booking using dynamic pricing
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(IPaymentRepository) private paymentRepository: IPaymentRepository,
    private pricingService: PricingService,
    private walletService: WalletService
  ) {}

  async execute(input: {
    tripId: string;
    passengerId: string;
    driverId: string;
    amount: number;
    serviceType?: ServiceType;
    distanceKm?: number;
    durationMinutes?: number;
    weightKg?: number;
    quantity?: number;
    paymentMethod: 'card' | 'wallet' | 'cash' | 'datafast' | 'deuna' | 'corporate';
    paymentMethodId?: string;
  }): Promise<any> {
    // Calculate fees dynamically based on service type
    let platformFee: number;
    let driverAmount: number;

    if (input.serviceType && input.serviceType !== 'accommodation') {
      // serviceType de pago es más amplio que PricingInput (p.ej. shared_route por
      // baseAmount); el service resuelve por serviceType en runtime → input as any.
      const pricingInput: any =
        input.serviceType === 'transport' || input.serviceType === 'shared'
          ? {
              serviceType: input.serviceType,
              distanceKm: input.distanceKm ?? 0,
              durationMinutes: input.durationMinutes ?? 0,
            }
          : input.serviceType === 'envio'
          ? {
              serviceType: 'envio',
              distanceKm: input.distanceKm ?? 0,
              weightKg: input.weightKg ?? 1,
            }
          : {
              serviceType: input.serviceType,
              baseAmount: input.amount,
              quantity: input.quantity ?? 1,
            };
      const fareBreakdown = this.pricingService.calculate(pricingInput);
      platformFee = fareBreakdown.platformFee;
      driverAmount = fareBreakdown.providerAmount;
    } else {
      // Fallback: standard 20/80 split
      platformFee = Math.round(input.amount * 0.2 * 100) / 100;
      driverAmount = Math.round(input.amount * 0.8 * 100) / 100;
    }

    // Create payment record
    const paymentId = uuidv4();
    const payment = await this.paymentRepository.create({
      id: paymentId,
      tripId: input.tripId,
      passengerId: input.passengerId,
      driverId: input.driverId,
      amount: input.amount,
      platformFee,
      driverAmount,
      paymentMethod: input.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
    });

    // Efectivo, wallet y corporate: pago confirmado al instante (sin procesador
    // externo). En 'corporate' no se cobra al pasajero — la empresa se factura
    // mensualmente aparte; aquí solo se registra el Payment (con el split 80/20)
    // para que el conductor reciba su 80% en el payout semanal.
    // Datafast y DeUna: el checkoutId/orderId se maneja en el controller,
    // aquí solo se registra el intento — se completa vía webhook.
    // Wallet (auditoría B1 #6): DEBITAR el saldo del pasajero antes de completar.
    // Antes se marcaba 'completed' sin mover el saldo → viajes gratis con wallet.
    // debit() es atómico (condicionado a saldo suficiente) e idempotente por ref
    // (reintentos del mismo pago no doble-debitan). Si no hay saldo, el pago falla.
    if (input.paymentMethod === 'wallet') {
      try {
        await this.walletService.debit(
          input.passengerId,
          input.amount,
          `Pago viaje ${input.tripId}`,
          `pay:${payment.id}`,
        );
      } catch (e) {
        await this.paymentRepository.update(payment.id, {
          status: 'failed',
          failureReason: (e as Error).message || 'Débito de wallet falló',
        });
        throw e;
      }
      return await this.paymentRepository.update(payment.id, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    if (
      input.paymentMethod === 'cash' ||
      input.paymentMethod === 'corporate'
    ) {
      return await this.paymentRepository.update(payment.id, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    // Datafast y DeUna son las DOS pasarelas de Going (decisión 19-jul-2026).
    // `card` entra aquí también: en Ecuador el adquirente de tarjeta es
    // Datafast, no es un método aparte. Stripe se eliminó porque no opera en
    // Ecuador y MercadoPago porque no se va a usar.
    if (
      input.paymentMethod === 'datafast' ||
      input.paymentMethod === 'deuna' ||
      input.paymentMethod === 'card'
    ) {
      // El pago digital ecuatoriano se inicia desde el controller
      // y se confirma cuando llega el webhook correspondiente
      return payment; // queda en status 'pending' hasta el webhook
    }

    throw new Error(`Método de pago no soportado: ${input.paymentMethod}`);
  }
}
