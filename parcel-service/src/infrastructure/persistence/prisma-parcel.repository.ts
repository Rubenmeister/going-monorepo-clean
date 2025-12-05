import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { IParcelRepository, Parcel } from '@going-monorepo-clean/domains-parcel-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaParcelRepository implements IParcelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(parcel: Parcel): Promise<Result<void, Error>> {
    try {
      const primitives = parcel.toPrimitives();
      
      await this.prisma.parcel.create({
        data: {
          id: primitives.id,
          senderId: primitives.userId,
          receiverId: primitives.userId, // Same as sender initially
          description: primitives.description || 'Package',
          weight: primitives.price?.amount || 1,
          price: primitives.price?.amount || 0,
          currency: primitives.price?.currency || 'USD',
          originCity: primitives.origin?.city || '',
          originAddress: primitives.origin?.address || '',
          destCity: primitives.destination?.city || '',
          destAddress: primitives.destination?.address || '',
          status: primitives.status,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save parcel: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Parcel | null, Error>> {
    try {
      const record = await this.prisma.parcel.findUnique({ where: { id } });
      
      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find parcel: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<Parcel[], Error>> {
    try {
      const records = await this.prisma.parcel.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find parcels by user: ${error.message}`));
    }
  }

  async findByDriverId(driverId: string): Promise<Result<Parcel[], Error>> {
    try {
      const records = await this.prisma.parcel.findMany({
        where: { driverId },
      });

      return ok(records.map(r => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find parcels by driver: ${error.message}`));
    }
  }

  async update(parcel: Parcel): Promise<Result<void, Error>> {
    try {
      const primitives = parcel.toPrimitives();
      
      await this.prisma.parcel.update({
        where: { id: primitives.id },
        data: {
          status: primitives.status,
          driverId: primitives.driverId || null,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update parcel: ${error.message}`));
    }
  }

  private toDomain(record: any): Parcel {
    return Parcel.fromPrimitives({
      id: record.id,
      userId: record.senderId,
      driverId: record.driverId,
      origin: {
        city: record.originCity,
        country: 'EC',
        address: record.originAddress,
      },
      destination: {
        city: record.destCity,
        country: 'EC',
        address: record.destAddress,
      },
      price: {
        amount: Number(record.price),
        currency: record.currency,
      },
      status: record.status,
      createdAt: record.createdAt,
    });
  }
}
