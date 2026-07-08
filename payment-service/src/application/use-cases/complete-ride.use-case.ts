import { Injectable, Inject, Logger } from '@nestjs/common';
import { IPaymentRepository, IPayoutRepository } from '../../domain/ports';
import { ProcessPaymentUseCase } from './process-payment.use-case';
import { LoyaltyClient } from '../loyalty-client.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Complete Ride Use Case
 * Completes a ride and processes associated payment.
 * Tras éxito, dispara award de puntos de fidelidad (Tipo B).
 */
@Injectable()
export class CompleteRideUseCase {
  private readonly logger = new Logger(CompleteRideUseCase.name);

  constructor(
    @Inject(IPaymentRepository) private paymentRepository: IPaymentRepository,
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository,
    private processPaymentUseCase: ProcessPaymentUseCase,
    private readonly loyaltyClient: LoyaltyClient,
  ) {}

  async execute(input: {
    tripId: string;
    passengerId: string;
    driverId: string;
    finalFare: number;
    actualDistance: number;
    actualDuration: number;
    paymentMethod: 'card' | 'wallet' | 'cash' | 'corporate';
    paymentMethodId?: string;
  }): Promise<{
    payment: any;
    completion: {
      tripId: string;
      finalFare: number;
      driverEarnings: number;
      platformRevenue: number;
      completedAt: Date;
    };
  }> {
    // Idempotencia por viaje: si ya existe un Payment para este tripId (p. ej.
    // el flujo digital lo creó vía intent/webhook), NO crear otro — evita doble
    // conteo de ganancias/comisión. El efectivo/wallet, que no tienen intent
    // previo, sí crean el Payment aquí.
    const existing = await this.paymentRepository.findByTrip(input.tripId);
    if (existing) {
      return {
        payment: existing,
        completion: {
          tripId: input.tripId,
          finalFare: existing.amount ?? input.finalFare,
          driverEarnings: existing.driverAmount ?? 0,
          platformRevenue: existing.platformFee ?? 0,
          completedAt: existing.completedAt ?? new Date(),
        },
      };
    }

    // Process the payment
    const payment = await this.processPaymentUseCase.execute({
      tripId: input.tripId,
      passengerId: input.passengerId,
      driverId: input.driverId,
      amount: input.finalFare,
      paymentMethod: input.paymentMethod,
      paymentMethodId: input.paymentMethodId,
    });

    if (!payment || payment.status !== 'completed') {
      throw new Error('Payment processing failed');
    }

    // Payout SEMANAL del conductor (la plataforma le paga 1 vez/semana,
    // agregando TODOS sus viajes). Delta de cada viaje al neto semanal:
    //  - retenido por la plataforma (digital/corporate/wallet): +driverAmount (80%).
    //  - EFECTIVO: el conductor ya cobró el 100% en mano → se RESTA su comisión
    //    -platformFee (20%), que le debe a la plataforma.
    // Neto semanal = Σ(80% digital/corporate) − Σ(20% comisión de efectivo).
    const weeklyDelta =
      input.paymentMethod === 'cash'
        ? -(payment.platformFee ?? 0)
        : (payment.driverAmount ?? 0);
    await this.recordDriverPayout(input.driverId, payment, weeklyDelta);

    // Award puntos de fidelidad al pasajero (fire-and-forget).
    // El cliente HTTP filtra solo Tipo B implícitamente: el endpoint
    // recibe userId + USD pagado; user-auth no diferencia segmento aquí
    // (asumimos que sólo Tipo B llega a Award; Tipo A no se llama).
    // FUTURO: filtrar aquí pasando clientSegment al input para no
    // acreditar a corporates/agencies.
    void this.loyaltyClient.awardPointsForRide({
      userId: input.passengerId,
      amountUsd: input.finalFare,
      tripId: input.tripId,
    });

    return {
      payment,
      completion: {
        tripId: input.tripId,
        finalFare: input.finalFare,
        driverEarnings: payment.driverAmount,
        platformRevenue: payment.platformFee,
        completedAt: new Date(),
      },
    };
  }

  private async recordDriverPayout(
    driverId: string,
    payment: any,
    /** Monto a sumar al payout semanal: +80% (retenido) o -20% (comisión cash). */
    delta: number,
  ): Promise<void> {
    try {
      // Get current date for payout period (weekly)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Check if payout already exists for this period
      const existingPayout = await this.payoutRepository.findByDriverAndPeriod(
        driverId,
        weekStart,
        weekEnd
      );

      if (existingPayout) {
        // Idempotencia (auditoría B1 #7): si este payment.id ya está contabilizado
        // en el payout de la semana, NO volver a sumarlo — evita doble payout si
        // dos complete-ride concurrentes del mismo viaje pasan el check de findByTrip.
        if ((existingPayout.transactionIds || []).includes(payment.id)) {
          return;
        }
        // Acumula el delta (puede restar, p. ej. comisión de efectivo).
        await this.payoutRepository.update(existingPayout.id, {
          amount: existingPayout.amount + delta,
          netAmount:
            existingPayout.netAmount + delta - (existingPayout.fees || 0),
          transactionCount: existingPayout.transactionCount + 1,
          transactionIds: [
            ...(existingPayout.transactionIds || []),
            payment.id,
          ],
        });
      } else {
        // Crea el payout de la semana con el primer delta.
        const payoutId = uuidv4();
        await this.payoutRepository.create({
          id: payoutId,
          driverId,
          amount: delta,
          currency: 'USD',
          status: 'pending',
          paymentMethod: 'bank_account',
          periodStart: weekStart,
          periodEnd: weekEnd,
          transactionCount: 1,
          transactionIds: [payment.id],
          fees: 0,
          netAmount: delta,
        });
      }
    } catch (error) {
      // Log error but don't fail the ride completion
      console.error(`Failed to record payout for driver ${driverId}:`, error);
    }
  }
}
