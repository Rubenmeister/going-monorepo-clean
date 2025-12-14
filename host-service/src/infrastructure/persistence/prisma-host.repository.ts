import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { Host, IHostRepository } from '@going-monorepo-clean/domains-anfitriones-core'; // Alias 'anfitriones' kept for library resolution
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaHostRepository implements IHostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(host: Host): Promise<Result<void, Error>> {
    try {
      const primitives = host.toPrimitives();
      await this.prisma.host.create({
        data: {
          id: primitives.id,
          userId: primitives.userId,
          name: primitives.name,
          phone: primitives.phone,
          isVerified: primitives.isVerified,
          createdAt: primitives.createdAt,
        },
      });
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save host: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Host | null, Error>> {
    try {
      const record = await this.prisma.host.findUnique({
        where: { id },
      });
      return ok(record ? this.toDomain(record) : null);
    } catch (error) {
      return err(new Error(`Failed to find host by id: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<Host | null, Error>> {
    try {
      const record = await this.prisma.host.findUnique({
        where: { userId },
      });
      return ok(record ? this.toDomain(record) : null);
    } catch (error) {
      return err(new Error(`Failed to find host by userId: ${error.message}`));
    }
  }

  async update(host: Host): Promise<Result<void, Error>> {
    try {
      const primitives = host.toPrimitives();
      await this.prisma.host.update({
        where: { id: primitives.id },
        data: {
          name: primitives.name,
          phone: primitives.phone,
          isVerified: primitives.isVerified,
        },
      });
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update host: ${error.message}`));
    }
  }

  private toDomain(record: any): Host {
    return Host.fromPrimitives({
      id: record.id,
      userId: record.userId,
      name: record.name,
      phone: record.phone,
      isVerified: record.isVerified,
      createdAt: record.createdAt,
    });
  }
}
