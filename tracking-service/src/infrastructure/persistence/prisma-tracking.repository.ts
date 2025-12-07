import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import {
  ITrackingRepository,
  TrackingEvent,
} from '@going-monorepo-clean/domains-tracking-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaTrackingRepository implements ITrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(event: TrackingEvent): Promise<Result<void, Error>> {
    try {
      const primitives = event.toPrimitives();

      await this.prisma.trackingEvent.create({
        data: {
          id: primitives.id,
          parcelId: primitives.parcelId,
          status: primitives.status,
          location: primitives.location,
          description: primitives.description,
          timestamp: primitives.timestamp,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save tracking event: ${error.message}`));
    }
  }

  async findByParcelId(parcelId: string): Promise<Result<TrackingEvent[], Error>> {
    try {
      const records = await this.prisma.trackingEvent.findMany({
        where: { parcelId },
        orderBy: { timestamp: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(
        new Error(`Failed to find tracking events: ${error.message}`)
      );
    }
  }

  private toDomain(record: any): TrackingEvent {
    return TrackingEvent.fromPrimitives({
      id: record.id,
      parcelId: record.parcelId,
      status: record.status,
      location: record.location,
      description: record.description,
      timestamp: record.timestamp,
    });
  }
}
