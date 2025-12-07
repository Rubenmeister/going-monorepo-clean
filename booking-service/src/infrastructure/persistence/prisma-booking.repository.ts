import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(booking: Booking): Promise<Result<void, Error>> {
    try {
      const primitives = booking.toPrimitives();

      await this.prisma.booking.create({
        data: {
          id: primitives.id,
          userId: primitives.userId,
          type: primitives.type,
          accommodationId: primitives.accommodationId,
          experienceId: primitives.experienceId,
          transportId: primitives.transportId,
          tourId: primitives.tourId,
          startDate: primitives.startDate,
          endDate: primitives.endDate,
          guests: primitives.guests,
          totalPrice: primitives.totalPrice,
          currency: primitives.currency,
          status: primitives.status,
          createdAt: primitives.createdAt,
          updatedAt: primitives.updatedAt,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save booking: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Booking | null, Error>> {
    try {
      const record = await this.prisma.booking.findUnique({
        where: { id },
      });

      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find booking: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<Booking[], Error>> {
    try {
      const records = await this.prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(
        new Error(`Failed to find bookings by user: ${error.message}`)
      );
    }
  }

  async update(booking: Booking): Promise<Result<void, Error>> {
    try {
      const primitives = booking.toPrimitives();

      await this.prisma.booking.update({
        where: { id: primitives.id },
        data: {
          status: primitives.status,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update booking: ${error.message}`));
    }
  }

  async findByType(
    type: string,
    userId?: string
  ): Promise<Result<Booking[], Error>> {
    try {
      const records = await this.prisma.booking.findMany({
        where: {
          type: type as any,
          ...(userId && { userId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(new Error(`Failed to find bookings by type: ${error.message}`));
    }
  }

  private toDomain(record: any): Booking {
    return Booking.fromPrimitives({
      id: record.id,
      userId: record.userId,
      type: record.type,
      accommodationId: record.accommodationId,
      experienceId: record.experienceId,
      transportId: record.transportId,
      tourId: record.tourId,
      startDate: record.startDate,
      endDate: record.endDate,
      guests: record.guests,
      totalPrice: Number(record.totalPrice),
      currency: record.currency,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
