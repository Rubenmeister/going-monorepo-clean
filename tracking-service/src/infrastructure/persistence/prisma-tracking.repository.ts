import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

@Injectable()
export class PrismaTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTrackingEvent(data: {
    parcelId: string;
    status: string;
    location?: string;
    description?: string;
  }) {
    return this.prisma.trackingEvent.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  }

  async findEventsByParcel(parcelId: string) {
    return this.prisma.trackingEvent.findMany({
      where: { parcelId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLatestEvent(parcelId: string) {
    return this.prisma.trackingEvent.findFirst({
      where: { parcelId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
