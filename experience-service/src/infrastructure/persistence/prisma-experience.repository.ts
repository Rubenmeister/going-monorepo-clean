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

  private toPrismaStatus(status: string): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    const map: Record<string, 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'> = {
      'draft': 'DRAFT',
      'published': 'PUBLISHED',
      'archived': 'ARCHIVED',
    };
    return map[status.toLowerCase()] || 'DRAFT';
  }

  private toDomainStatus(status: string): 'draft' | 'published' | 'archived' {
    return status.toLowerCase() as 'draft' | 'published' | 'archived';
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
          currency: 'USD',
          location: primitives.location,
          maxCapacity: primitives.maxCapacity,
          durationHours: 2, // Default, could be added to domain
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
          status: 'PUBLISHED',
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
      maxCapacity: record.maxCapacity,
      location: record.location,
      status: this.toDomainStatus(record.status),
      createdAt: record.createdAt,
    });
  }
}
