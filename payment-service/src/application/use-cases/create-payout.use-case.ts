import { Injectable, Inject } from '@nestjs/common';
import { IPayoutRepository } from '../../domain/ports';
import { StripeGateway } from '../../infrastructure/gateways/stripe.gateway';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create Payout Use Case
 * Creates and processes payout to driver
 */
@Injectable()
export class CreatePayoutUseCase {
  constructor(
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository,
    private stripeGateway: StripeGateway
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

    // Process payout with Stripe
    if (input.paymentMethod === 'bank_account') {
      const result = await this.stripeGateway.createPayout({
        amount: Math.round(payout.netAmount * 100), // Convert to cents
        currency: 'USD',
        bankAccountId: input.bankAccountId,
        description: `Payout to driver ${input.driverId} for rides`,
        metadata: {
          driverId: input.driverId,
          payoutId,
          periodStart: payout.periodStart.toISOString(),
          periodEnd: payout.periodEnd.toISOString(),
        },
      });

      if (result.success && result.payoutId) {
        // Update payout status to processing
        const updated = await this.payoutRepository.update(payout.id, {
          status: 'processing',
          metadata: {
            stripePayoutId: result.payoutId,
          },
        });

        // Mark old payouts as processed
        for (const oldPayout of driverPayouts) {
          await this.payoutRepository.update(oldPayout.id, {
            status: 'completed',
            processedAt: new Date(),
          });
        }

        return updated;
      } else {
        await this.payoutRepository.update(payout.id, {
          status: 'failed',
          failureReason: result.error || 'Payout creation failed',
        });

        throw new Error(result.error || 'Payout creation failed');
      }
    }

    // For other payment methods, mark as completed immediately
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
