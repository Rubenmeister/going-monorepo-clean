import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { IAccommodationRepository, Accommodation } from '@going-monorepo-clean/domains-accommodation-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaAccommodationRepository implements IAccommodationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(accommodation: Accommodation): Promise<Result<void, Error>> {
    try {
      const primitives = accommodation.toPrimitives();
      
      await this.prisma.accommodation.create({
        data: {
          id: primitives.id,
          hostId: primitives.hostId,
          title: primitives.title,
          description: primitives.description,
          pricePerNight: primitives.pricePerNight,
          currency: primitives.currency || 'USD',
          capacity: primitives.capacity,
          city: primitives.city,
          country: primitives.country,
          address: primitives.address,
          latitude: primitives.latitude || null,
          longitude: primitives.longitude || null,
          status: primitives.status || 'DRAFT',
          amenities: primitives.amenities || [],
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save accommodation: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Accommodation | null, Error>> {
    try {
      const record = await this.prisma.accommodation.findUnique({ where: { id } });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find accommodation: ${error.message}`));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Accommodation[], Error>> {
    try {
      const records = await this.prisma.accommodation.findMany({
        where: { hostId },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find accommodations by host: ${error.message}`));
    }
  }

  async update(accommodation: Accommodation): Promise<Result<void, Error>> {
    try {
      const primitives = accommodation.toPrimitives();
      
      await this.prisma.accommodation.update({
        where: { id: primitives.id },
        data: {
          title: primitives.title,
          description: primitives.description,
          pricePerNight: primitives.pricePerNight,
          currency: primitives.currency,
          capacity: primitives.capacity,
          status: primitives.status,
          amenities: primitives.amenities,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update accommodation: ${error.message}`));
    }
  }

  async search(filters: any): Promise<Result<Accommodation[], Error>> {
    try {
      const records = await this.prisma.accommodation.findMany({
        where: {
          status: 'PUBLISHED',
          ...(filters.city && { city: filters.city }),
          ...(filters.minPrice && { pricePerNight: { gte: filters.minPrice } }),
          ...(filters.maxPrice && { pricePerNight: { lte: filters.maxPrice } }),
        },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to search accommodations: ${error.message}`));
    }
  }

  private toDomain(record: any): Accommodation {
    return Accommodation.fromPrimitives({
      id: record.id,
      hostId: record.hostId,
      title: record.title,
      description: record.description,
      pricePerNight: Number(record.pricePerNight),
      currency: record.currency,
      capacity: record.capacity,
      city: record.city,
      country: record.country,
      address: record.address,
      latitude: record.latitude,
      longitude: record.longitude,
      status: record.status,
      amenities: record.amenities,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
