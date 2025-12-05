import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { IHostRepository, Host } from '@going-monorepo-clean/domains-anfitriones-core';
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
          phone: primitives.phone || null,
          isVerified: primitives.isVerified || false,
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
        include: { user: true } // Get user email
      });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find host: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<Host | null, Error>> {
    try {
      const record = await this.prisma.host.findUnique({ 
        where: { userId },
        include: { user: true }
      });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find host by userId: ${error.message}`));
    }
  }

  async findAll(): Promise<Result<Host[], Error>> {
    try {
      const records = await this.prisma.host.findMany({
        include: { user: true }
      });
      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find hosts: ${error.message}`));
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
      email: record.user?.email || '',  // Get from joined user
      phone: record.phone,
      isVerified: record.isVerified,
      createdAt: record.createdAt,
    });
  }
}
