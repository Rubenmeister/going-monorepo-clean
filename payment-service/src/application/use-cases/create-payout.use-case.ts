import { Injectable, Inject } from '@nestjs/common';
import { IPayoutRepository } from '../../domain/ports';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create Payout Use Case
 * Creates and processes payout to driver
 */
@Injectable()
export class CreatePayoutUseCase {
  constructor(
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository,
  ) {}

  async execute(input: {
    driverId: string;
    bankAccountId: string;
    paymentMethod: 'bank_account' | 'debit_card' | 'wallet';
  }): Promise<any> {
    // Get all pending payouts for the driver
    const pendingPayouts = await this.payoutRepository.findByStatus('pending');
    const driverPayouts = pendingPayouts.filter(
      (p) => p.driverId === input.driverId
    );

    if (driverPayouts.length === 0) {
      throw new Error('No pending payouts found for this driver');
    }

    // Aggregate all pending payouts into a single payout
    let totalAmount = 0;
    let totalTransactions = 0;
    const allTransactionIds: string[] = [];

    const oldestPayout = driverPayouts[driverPayouts.length - 1];
    const newestPayout = driverPayouts[0];

    driverPayouts.forEach((payout) => {
      totalAmount += payout.netAmount;
      totalTransactions += payout.transactionCount;
      allTransactionIds.push(...(payout.transactionIds || []));
    });

    // Create aggregated payout
    const payoutId = uuidv4();
    const payout = await this.payoutRepository.create({
      id: payoutId,
      driverId: input.driverId,
      amount: totalAmount,
      currency: 'USD',
      status: 'pending',
      paymentMethod: input.paymentMethod,
      periodStart: oldestPayout.periodStart,
      periodEnd: newestPayout.periodEnd,
      transactionCount: totalTransactions,
      transactionIds: allTransactionIds,
      fees: this.calculatePayoutFees(totalAmount),
      netAmount: totalAmount - this.calculatePayoutFees(totalAmount),
    });

    // Transferencia bancaria a la conductora o el conductor.
    //
    // Antes esto lo ejecutaba Stripe, que NUNCA operó en Ecuador: la
    // transferencia no salía y el registro quedaba en 'failed'. Al eliminar
    // Stripe (19-jul-2026) no se reemplaza por otra pasarela porque ni Datafast
    // ni DeUna hacen envío de fondos: ambas son de COBRO.
    //
    // Queda en 'pending' a la espera de la transferencia manual desde el banco.
    // Deliberadamente NO se marca 'completed': el dinero no se movió, y decir
    // que sí dejaría a alguien sin cobrar sin que nadie se entere.
    if (input.paymentMethod === 'bank_account') {
      const pendiente = await this.payoutRepository.update(payout.id, {
        status: 'pending',
        metadata: {
          requiereTransferenciaManual: true,
          bankAccountId: input.bankAccountId,
        },
      });

      // Los pagos del período quedan agrupados en este pago pendiente; no se
      // dan por procesados hasta que la transferencia se confirme.
      return pendiente;
    }

    // Billetera interna: el saldo se acredita en el acto, sin banco de por medio.
    return await this.payoutRepository.update(payout.id, {
      status: 'completed',
      processedAt: new Date(),
    });
  }

  private calculatePayoutFees(amount: number): number {
    // 2% payout fee
    return Math.round(amount * 0.02 * 100) / 100;
  }
}
