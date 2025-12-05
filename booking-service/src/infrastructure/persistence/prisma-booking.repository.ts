import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

@Injectable()
export class PrismaBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(data: {
    userId: string;
    type: 'ACCOMMODATION' | 'EXPERIENCE' | 'TRANSPORT' | 'TOUR';
    accommodationId?: string;
    experienceId?: string;
    transportId?: string;
    tourId?: string;
    startDate: Date;
    endDate?: Date;
    guests: number;
    totalPrice: number;
    currency?: string;
  }) {
    return this.prisma.booking.create({
      data: {
        ...data,
        currency: data.currency || 'USD',
        status: 'PENDING',
      },
    });
  }

  async findBookingById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { 
        user: true,
        accommodation: true,
        experience: true,
        transport: true,
        tour: true,
        payment: true 
      },
    });
  }

  async findBookingsByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { 
        accommodation: true,
        experience: true,
        transport: true,
        tour: true,
        payment: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(
    id: string, 
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  async confirmBooking(id: string) {
    return this.updateBookingStatus(id, 'CONFIRMED');
  }

  async cancelBooking(id: string) {
    return this.updateBookingStatus(id, 'CANCELLED');
  }
}
