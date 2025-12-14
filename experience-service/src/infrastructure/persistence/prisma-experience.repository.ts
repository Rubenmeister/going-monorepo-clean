import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { 
  IExperienceRepository, 
  Experience, 
  ExperienceSearchFilters 
} from '@going-monorepo-clean/domains-experience-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaExperienceRepository implements IExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toPrismaStatus(status: string): ExperienceStatus {
    // Prisma expects the enum values defined in the schema (lowercase)
    return status as ExperienceStatus;
  }

  private toDomainStatus(status: ExperienceStatus): 'draft' | 'published' | 'archived' {
    // Convert Prisma enum back to domain string literals
    return status as 'draft' | 'published' | 'archived';
  }

  async save(experience: Experience): Promise<Result<void, Error>> {
    try {
      const primitives = experience.toPrimitives();
      
      await this.prisma.experience.create({
        data: {
          id: primitives.id,
          hostId: primitives.hostId,
          title: primitives.title,
          description: primitives.description,
          pricePerPerson: primitives.pricePerPerson,
          currency: primitives.currency,
          location: primitives.location,
          maxCapacity: primitives.maxCapacity,
          durationHours: primitives.durationHours,
          status: this.toPrismaStatus(primitives.status),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save experience: ${error.message}`));
    }
  }

  async update(experience: Experience): Promise<Result<void, Error>> {
    try {
      const primitives = experience.toPrimitives();
      
      await this.prisma.experience.update({
        where: { id: primitives.id },
        data: {
          title: primitives.title,
          description: primitives.description,
          pricePerPerson: primitives.pricePerPerson,
          location: primitives.location,
          maxCapacity: primitives.maxCapacity,
          status: this.toPrismaStatus(primitives.status),
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update experience: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Experience | null, Error>> {
    try {
      const record = await this.prisma.experience.findUnique({ where: { id } });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find experience: ${error.message}`));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Experience[], Error>> {
    try {
      const records = await this.prisma.experience.findMany({
        where: { hostId },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find experiences by host: ${error.message}`));
    }
  }

  async searchPublished(filters: ExperienceSearchFilters): Promise<Result<Experience[], Error>> {
    try {
      const records = await this.prisma.experience.findMany({
        where: {
          status: 'published',
          ...(filters.location && { location: { contains: filters.location } }),
          ...(filters.hostId && { hostId: filters.hostId }),
          ...(filters.minPrice && { pricePerPerson: { gte: filters.minPrice } }),
          ...(filters.maxPrice && { pricePerPerson: { lte: filters.maxPrice } }),
        },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to search experiences: ${error.message}`));
    }
  }

  private toDomain(record: any): Experience {
    return Experience.fromPrimitives({
      id: record.id,
      hostId: record.hostId,
      title: record.title,
      description: record.description,
      pricePerPerson: Number(record.pricePerPerson),
      currency: record.currency,
      maxCapacity: record.maxCapacity,
      durationHours: record.durationHours,
      location: record.location,
      status: this.toDomainStatus(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
