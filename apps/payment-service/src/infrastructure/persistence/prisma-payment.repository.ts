import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { Payment, IPaymentRepository } from '@going-monorepo-clean/domains-payment';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(payment: Payment): Promise<Result<void, Error>> {
    try {
      // Manual mapping of status to avoid type issues with Prisma Enums vs Domain Strings
      // In a perfect world, we'd import the Prisma Enum, but casting is safer given cross-lib restrictions
      const statusValue = (
        payment.status === 'succeeded' ? 'succeeded' : 
        payment.status === 'failed' ? 'failed' : 
        payment.status === 'refunded' ? 'refunded' : 'pending'
      ) as any;

      const data = {
        id: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        status: statusValue,
        transactionId: payment.externalTransactionId,
        metadata: {}, 
        method: 'DEBIT_CARD' as any,
      };

      await this.prisma.payment.upsert({
        where: { id: data.id },
        update: {
          status: data.status,
          transactionId: data.transactionId,
          updatedAt: new Date()
        },
        create: {
          id: data.id,
          userId: data.userId,
          bookingId: data.bookingId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          transactionId: data.transactionId,
          method: 'DEBIT_CARD',
          metadata: {},
        }
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save payment: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Payment | null, Error>> {
    try {
      const record = await this.prisma.payment.findUnique({ where: { id } });
      if (!record) return ok(null);
      // Logic to map back to Domain Entity would go here.
      // Leaving as null for now as per previous logic
      return ok(null); 
    } catch (error) {
       return err(new Error(error.message));
    }
  }
}
