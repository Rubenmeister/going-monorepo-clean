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
        mode: primitives.mode,
        licensePlate: 'PENDING', // Default, can be updated later
        capacity: trip.getMaxCapacity(),
        pricePerKm: primitives.basePrice,
        pricePerPassenger: primitives.pricePerPassenger,
        currency: primitives.currency,
        status: primitives.status.toUpperCase() as any, // Cast to any to avoid Enum mismatch during build
        originCity: primitives.originCity,
        originAddress: primitives.originAddress,
        destCity: primitives.destCity,
        destAddress: primitives.destAddress,
        stationOrigin: primitives.stationOrigin,
        stationDest: primitives.stationDest,
        departureTime: primitives.departureTime,
        arrivalTime: primitives.estimatedArrivalTime,
        passengers: primitives.passengers as any,
      },
      update: {
        status: primitives.status.toUpperCase() as any,
        pricePerKm: primitives.basePrice,
        pricePerPassenger: primitives.pricePerPassenger,
        departureTime: primitives.departureTime,
        arrivalTime: primitives.estimatedArrivalTime,
        originCity: primitives.originCity,
        originAddress: primitives.originAddress,
        destCity: primitives.destCity,
        destAddress: primitives.destAddress,
        stationOrigin: primitives.stationOrigin,
        stationDest: primitives.stationDest,
        passengers: primitives.passengers as any,
      },
    });
  }

  async findById(id: UUID): Promise<Trip | null> {
    const record = await this.prisma.transport.findUnique({
      where: { id: id },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findAvailableSharedTrips(origin: Location, dest: Location, vehicleType: 'SUV' | 'VAN'): Promise<Trip[]> {
    const records = await this.prisma.transport.findMany({
      where: {
        status: 'SCHEDULED' as any,
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

  private toDomain(record: any): Trip {
    // Parse passengers from JSON
    const passengers = Array.isArray(record.passengers) 
      ? record.passengers 
      : (typeof record.passengers === 'string' ? JSON.parse(record.passengers) : []);

    return Trip.fromPrimitives({
      id: record.id,
      driverId: record.driverId,
      vehicleType: record.vehicleType as VehicleType,
      mode: record.mode as TravelMode,
      status: (record.status as string).toLowerCase() as any,
      passengers: passengers,
      originCity: record.originCity,
      originAddress: record.originAddress,
      destCity: record.destCity,
      destAddress: record.destAddress,
      stationOrigin: record.stationOrigin,
      stationDest: record.stationDest,
      departureTime: new Date(record.departureTime),
      estimatedArrivalTime: new Date(record.arrivalTime),
      basePrice: Number(record.pricePerKm),
      pricePerPassenger: Number(record.pricePerPassenger),
      currency: record.currency,
      createdAt: record.createdAt,
    });
  }
}
