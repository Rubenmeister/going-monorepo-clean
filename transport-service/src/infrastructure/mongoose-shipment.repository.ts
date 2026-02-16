import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Shipment, IShipmentRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ShipmentDocument, ShipmentModelSchema } from './schemas/shipment.schema';

@Injectable()
export class MongooseShipmentRepository implements IShipmentRepository {
  constructor(
    @InjectModel(ShipmentModelSchema.name)
    private readonly model: Model<ShipmentDocument>,
  ) {}

  async save(shipment: Shipment): Promise<Result<void, Error>> {
    try {
      const newDoc = new this.model(shipment.toPrimitives());
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(shipment: Shipment): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id: shipment.id }, { $set: shipment.toPrimitives() }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Shipment | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? Shipment.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findBySenderId(senderId: UUID): Promise<Result<Shipment[], Error>> {
    try {
      const docs = await this.model.find({ senderId }).sort({ createdAt: -1 }).exec();
      return ok(docs.map(d => Shipment.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByVehicleId(vehicleId: UUID): Promise<Result<Shipment[], Error>> {
    try {
      const docs = await this.model.find({ vehicleId }).exec();
      return ok(docs.map(d => Shipment.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findPendingShipments(): Promise<Result<Shipment[], Error>> {
    try {
      const docs = await this.model.find({ status: 'pending' }).sort({ createdAt: 1 }).exec();
      return ok(docs.map(d => Shipment.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
