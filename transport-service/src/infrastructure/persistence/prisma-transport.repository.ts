import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import { ITripRepository, Trip, TripStatus, VehicleType, TravelMode } from '@going-monorepo-clean/domains-transport-core';
import { UUID, Location } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PrismaTransportRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(trip: Trip): Promise<void> {
    const primitives = trip.toPrimitives();
    
    await this.prisma.transport.upsert({
      where: { id: primitives.id },
      create: {
        id: primitives.id,
        driverId: primitives.driverId,
        vehicleType: primitives.vehicleType,
        licensePlate: 'PENDING', // Default or need to add to entity
        capacity: trip.getMaxCapacity(),
        pricePerKm: primitives.basePrice,
        currency: primitives.currency,
        status: this.toPrismaStatus(primitives.status),
        originCity: primitives.originCity,
        originAddress: primitives.originAddress,
        destCity: primitives.destCity,
        destAddress: primitives.destAddress,
        departureTime: primitives.departureTime,
        arrivalTime: primitives.estimatedArrivalTime,
      },
      update: {
        status: this.toPrismaStatus(primitives.status),
        pricePerKm: primitives.basePrice,
        departureTime: primitives.departureTime,
        arrivalTime: primitives.estimatedArrivalTime,
        originCity: primitives.originCity,
        originAddress: primitives.originAddress,
        destCity: primitives.destCity,
        destAddress: primitives.destAddress,
      },
    });
  }

  async findById(id: UUID): Promise<Trip | null> {
    const record = await this.prisma.transport.findUnique({
      where: { id: id }, // UUID is string alias, so no .value
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findAvailableSharedTrips(origin: Location, dest: Location, vehicleType: 'SUV' | 'VAN'): Promise<Trip[]> {
    const records = await this.prisma.transport.findMany({
      where: {
        status: 'AVAILABLE',
        vehicleType: vehicleType,
        originCity: origin.city,
        destCity: dest.city,
      },
    });

    return records.map(r => this.toDomain(r));
  }

  async findTripsByDriverId(driverId: string): Promise<Trip[]> {
    const records = await this.prisma.transport.findMany({
      where: { driverId },
    });

    return records.map(r => this.toDomain(r));
  }

  async update(trip: Trip): Promise<void> {
    await this.save(trip);
  }

  private toPrismaStatus(status: TripStatus): 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE' | 'INACTIVE' {
    switch (status) {
      case 'SCHEDULED': return 'AVAILABLE';
      case 'WAITING_PASSENGERS': return 'AVAILABLE';
      case 'IN_TRANSIT': return 'IN_SERVICE';
      case 'COMPLETED': return 'AVAILABLE';
      case 'CANCELLED': return 'INACTIVE';
      default: return 'AVAILABLE';
    }
  }

  private toDomain(record: any): Trip {
    return Trip.fromPrimitives({
      id: record.id,
      driverId: record.driverId,
      vehicleType: record.vehicleType as VehicleType,
      mode: 'POINT_TO_POINT', // Default
      status: this.fromPrismaStatus(record.status),
      passengers: [], // Need to fetch passengers/bookings
      originCity: record.originCity || '',
      originAddress: record.originAddress || '',
      destCity: record.destCity || '',
      destAddress: record.destAddress || '',
      departureTime: record.departureTime || new Date(),
      estimatedArrivalTime: record.arrivalTime || new Date(),
      basePrice: Number(record.pricePerKm),
      pricePerPassenger: Number(record.pricePerKm),
      currency: record.currency,
      createdAt: record.createdAt,
    });
  }

  private fromPrismaStatus(status: string): TripStatus {
    switch (status) {
      case 'AVAILABLE': return 'SCHEDULED';
      case 'IN_SERVICE': return 'IN_TRANSIT';
      case 'INACTIVE': return 'CANCELLED';
      default: return 'SCHEDULED';
    }
  }
}
