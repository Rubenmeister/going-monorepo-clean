import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

@Injectable()
export class PrismaPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Payment CRUD
  async createPayment(data: {
    userId: string;
    bookingId?: string;
    parcelId?: string;
    amount: number;
    currency?: string;
    method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH';
  }) {
    return this.prisma.payment.create({
      data: {
        ...data,
        currency: data.currency || 'USD',
        status: 'PENDING',
      },
    });
  }

  async findPaymentById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { user: true, booking: true, parcel: true },
    });
  }

  async findPaymentsByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { booking: true, parcel: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPaymentByTransactionId(transactionId: string) {
    return this.prisma.payment.findFirst({
      where: { transactionId },
    });
  }

  async updatePaymentStatus(
    id: string, 
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
    transactionId?: string
  ) {
    return this.prisma.payment.update({
      where: { id },
      data: { 
        status,
        transactionId,
      },
    });
  }

  async completePayment(id: string, transactionId: string) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        transactionId,
      },
    });
  }

  async failPayment(id: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  }

  async refundPayment(id: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
  }

  // Stats
  async getTotalByUser(userId: string) {
    const result = await this.prisma.payment.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
}
