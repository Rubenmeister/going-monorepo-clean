import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import {
  Tour,
  ITourRepository,
} from '@going-monorepo-clean/domains-tour-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaTourRepository implements ITourRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(tour: Tour): Promise<Result<void, Error>> {
    try {
      const primitives = tour.toPrimitives();

      await this.prisma.tour.create({
        data: {
          id: primitives.id,
          hostId: primitives.hostId,
          title: primitives.title,
          description: primitives.description,

          pricePerPerson: primitives.pricePerPerson,
          currency: primitives.currency,
          maxCapacity: primitives.maxCapacity,
          durationHours: primitives.durationHours,
          location: primitives.location,
          meetingPoint: primitives.location, // Default to location
          createdAt: primitives.createdAt,
          updatedAt: primitives.updatedAt,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save tour: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Tour | null, Error>> {
    try {
      const record = await this.prisma.tour.findUnique({
        where: { id },
      });

      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find tour: ${error.message}`));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Tour[], Error>> {
    try {
      const records = await this.prisma.tour.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find tours by host: ${error.message}`));
    }
  }

  async update(tour: Tour): Promise<Result<void, Error>> {
    try {
      const primitives = tour.toPrimitives();

      await this.prisma.tour.update({
        where: { id: primitives.id },
        data: {
          title: primitives.title,
          description: primitives.description,

          pricePerPerson: primitives.pricePerPerson,
          maxCapacity: primitives.maxCapacity,
          durationHours: primitives.durationHours,
          location: primitives.location,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update tour: ${error.message}`));
    }
  }

  async findByStatus(status: string): Promise<Result<Tour[], Error>> {
    try {
      const records = await this.prisma.tour.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find tours by status: ${error.message}`));
    }
  }

  private toDomain(record: any): Tour {
    return Tour.fromPrimitives({
      id: record.id,
      hostId: record.hostId,
      title: record.title,
      description: record.description,
      status: record.status,
      pricePerPerson: Number(record.pricePerPerson),
      currency: record.currency,
      maxCapacity: record.maxCapacity,
      durationHours: record.durationHours,
      location: record.location,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
