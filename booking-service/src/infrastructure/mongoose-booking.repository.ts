import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Booking,
  IBookingRepository,
  ServiceType,
} from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  BookingDocument,
  BookingModelSchema,
} from './schemas/booking.schema';

@Injectable()
export class MongooseBookingRepository implements IBookingRepository {
  constructor(
    @InjectModel(BookingModelSchema.name)
    private readonly model: Model<BookingDocument>,
  ) {}

  async save(booking: Booking): Promise<Result<void, Error>> {
    try {
      const primitives = booking.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(booking: Booking): Promise<Result<void, Error>> {
    try {
      const primitives = booking.toPrimitives();
      await this.model
        .updateOne({ id: booking.id }, { $set: primitives })
        .exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Booking | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByUserId(userId: UUID): Promise<Result<Booking[], Error>> {
    try {
      const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByServiceId(serviceId: UUID, serviceType: ServiceType): Promise<Result<Booking[], Error>> {
    try {
      const docs = await this.model.find({ serviceId, serviceType }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  // Convierte el documento de Mongoose de vuelta a una Entidad de Dominio
  private toDomain(doc: BookingDocument): Booking {
    return Booking.fromPrimitives(doc.toObject() as any);
  }
}