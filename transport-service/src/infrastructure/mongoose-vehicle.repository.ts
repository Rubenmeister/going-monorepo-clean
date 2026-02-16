import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Vehicle, IVehicleRepository } from '@going-monorepo-clean/domains-transport-core';
import { VehicleTypeEnum } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { VehicleDocument, VehicleModelSchema } from './schemas/vehicle.schema';

@Injectable()
export class MongooseVehicleRepository implements IVehicleRepository {
  constructor(
    @InjectModel(VehicleModelSchema.name)
    private readonly model: Model<VehicleDocument>,
  ) {}

  async save(vehicle: Vehicle): Promise<Result<void, Error>> {
    try {
      const primitives = vehicle.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(vehicle: Vehicle): Promise<Result<void, Error>> {
    try {
      const primitives = vehicle.toPrimitives();
      await this.model.updateOne({ id: vehicle.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Vehicle | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByDriverId(driverId: UUID): Promise<Result<Vehicle[], Error>> {
    try {
      const docs = await this.model.find({ driverId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByPlate(plate: string): Promise<Result<Vehicle | null, Error>> {
    try {
      const doc = await this.model.findOne({ plate: plate.toUpperCase() }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveByType(type: VehicleTypeEnum): Promise<Result<Vehicle[], Error>> {
    try {
      const docs = await this.model.find({ type, status: 'active' }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findAvailableVehiclesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    vehicleType?: VehicleTypeEnum,
  ): Promise<Result<Vehicle[], Error>> {
    try {
      const query: any = {
        status: 'active',
        'currentLocation': { $exists: true },
      };
      if (vehicleType) {
        query.type = vehicleType;
      }

      const docs = await this.model.find(query).exec();
      const vehicles = docs.map(this.toDomain);

      // Filtrar por distancia usando Haversine
      const filtered = vehicles.filter(v => {
        if (!v.currentLocation) return false;
        const dist = this.haversineKm(
          latitude, longitude,
          v.currentLocation.latitude, v.currentLocation.longitude,
        );
        return dist <= radiusKm;
      });

      return ok(filtered);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toDomain(doc: VehicleDocument): Vehicle {
    return Vehicle.fromPrimitives(doc.toObject() as any);
  }
}
