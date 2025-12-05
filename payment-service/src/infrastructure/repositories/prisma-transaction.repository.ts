import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { ITransactionRepository } from '@going-monorepo-clean/domains-payment-core';
import { Result, ok, err } from 'neverthrow';

// Simplified Transaction primitives
interface TransactionPrimitives {
  id: string;
  userId: string;
  bookingId?: string;
  parcelId?: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(transaction: any): Promise<Result<void, Error>> {
    try {
      const primitives = transaction.toPrimitives ? transaction.toPrimitives() : transaction;
      
      await this.prisma.payment.create({
        data: {
          id: primitives.id,
          userId: primitives.userId,
          bookingId: primitives.bookingId || null,
          parcelId: primitives.parcelId || null,
          amount: primitives.amount || primitives.amount?.value || 0,
          currency: primitives.currency || 'USD',
          method: this.toPrismaMethod(primitives.method || 'CREDIT_CARD'),
          status: this.toPrismaStatus(primitives.status || 'PENDING'),
          transactionId: primitives.paymentIntentId || primitives.transactionId || null,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save transaction: ${error.message}`));
    }
  }

  async update(transaction: any): Promise<Result<void, Error>> {
    try {
      const primitives = transaction.toPrimitives ? transaction.toPrimitives() : transaction;
      
      await this.prisma.payment.update({
        where: { id: primitives.id },
        data: {
          status: this.toPrismaStatus(primitives.status),
          transactionId: primitives.paymentIntentId || primitives.transactionId,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update transaction: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<any | null, Error>> {
    try {
      const record = await this.prisma.payment.findUnique({ 
        where: { id },
        include: { user: true, booking: true }
      });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomainPrimitives(record));
    } catch (error) {
      return err(new Error(`Failed to find transaction: ${error.message}`));
    }
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Result<any | null, Error>> {
    try {
      const record = await this.prisma.payment.findFirst({
        where: { transactionId: paymentIntentId },
        include: { user: true, booking: true }
      });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomainPrimitives(record));
    } catch (error) {
      return err(new Error(`Failed to find transaction by payment intent: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<any[], Error>> {
    try {
      const records = await this.prisma.payment.findMany({
        where: { userId },
        include: { booking: true },
        orderBy: { createdAt: 'desc' }
      });

      return ok(records.map(r => this.toDomainPrimitives(r)));
    } catch (error) {
      return err(new Error(`Failed to find transactions by user: ${error.message}`));
    }
  }

  private toPrismaStatus(status: string): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' {
    const map: Record<string, any> = {
      'PENDING': 'PENDING',
      'PROCESSING': 'PROCESSING',
      'CONFIRMED': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'FAILED': 'FAILED',
      'CANCELLED': 'FAILED',
      'REFUNDED': 'REFUNDED',
    };
    return map[status.toUpperCase()] || 'PENDING';
  }

  private toPrismaMethod(method: string): 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH' {
    const map: Record<string, any> = {
      'CREDIT_CARD': 'CREDIT_CARD',
      'DEBIT_CARD': 'DEBIT_CARD',
      'BANK_TRANSFER': 'BANK_TRANSFER',
      'WALLET': 'WALLET',
      'CASH': 'CASH',
    };
    return map[method.toUpperCase()] || 'CREDIT_CARD';
  }

  private toDomainPrimitives(record: any): TransactionPrimitives {
    return {
      id: record.id,
      userId: record.userId,
      bookingId: record.bookingId,
      parcelId: record.parcelId,
      amount: Number(record.amount),
      currency: record.currency,
      method: record.method,
      status: record.status,
      transactionId: record.transactionId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
