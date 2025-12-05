import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { ITourRepository, Tour, TourStatus } from '@going-monorepo-clean/domains-tour-core';

@Injectable()
export class PrismaTourRepository implements ITourRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(tour: Tour): Promise<void> {
    const primitives = tour.toPrimitives();

    await this.prisma.tour.upsert({
      where: { id: primitives.id },
      create: {
        id: primitives.id,
        hostId: primitives.hostId,
        title: primitives.title,
        description: primitives.description,
        pricePerPerson: primitives.pricePerPerson,
        currency: primitives.currency,
        maxCapacity: primitives.maxCapacity,
        durationHours: primitives.durationHours,
        location: primitives.location,
        meetingPoint: primitives.meetingPoint,
        status: this.toPrismaStatus(primitives.status),
      },
      update: {
        title: primitives.title,
        description: primitives.description,
        pricePerPerson: primitives.pricePerPerson,
        currency: primitives.currency,
        maxCapacity: primitives.maxCapacity,
        durationHours: primitives.durationHours,
        location: primitives.location,
        meetingPoint: primitives.meetingPoint,
        status: this.toPrismaStatus(primitives.status),
      },
    });
  }

  async findById(id: string): Promise<Tour | null> {
    const record = await this.prisma.tour.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByHostId(hostId: string): Promise<Tour[]> {
    const records = await this.prisma.tour.findMany({
      where: { hostId },
    });

    return records.map(r => this.toDomain(r));
  }

  async search(filters: { location?: string; minPrice?: number; maxPrice?: number }): Promise<Tour[]> {
    const records = await this.prisma.tour.findMany({
      where: {
        status: 'PUBLISHED',
        ...(filters.location && { location: { contains: filters.location } }),
        ...(filters.minPrice && { pricePerPerson: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { pricePerPerson: { lte: filters.maxPrice } }),
      },
    });

    return records.map(r => this.toDomain(r));
  }

  async update(tour: Tour): Promise<void> {
    await this.save(tour);
  }

  private toPrismaStatus(status: TourStatus): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    return status;
  }

  private toDomain(record: any): Tour {
    return Tour.fromPrimitives({
      id: record.id,
      hostId: record.hostId,
      title: record.title,
      description: record.description,
      pricePerPerson: Number(record.pricePerPerson),
      currency: record.currency,
      maxCapacity: record.maxCapacity,
      durationHours: Number(record.durationHours),
      location: record.location,
      meetingPoint: record.meetingPoint,
      status: record.status as TourStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
