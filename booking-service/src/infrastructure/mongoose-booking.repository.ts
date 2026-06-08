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
} from './persistence/schemas/booking.schema';
import {
  PaginationDto,
  PaginatedResult,
  getPaginationOptions,
  createPaginatedResponse,
} from '@going-monorepo-clean/shared-database';

@Injectable()
export class MongooseBookingRepository implements IBookingRepository {
  constructor(
    @InjectModel(BookingModelSchema.name)
    private readonly model: Model<BookingDocument>
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
      const docs = await this.model
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByCompany(
    companyId: UUID,
    opts?: { status?: string; limit?: number; skip?: number },
  ): Promise<Result<Booking[], Error>> {
    try {
      const query: Record<string, unknown> = { companyId };
      if (opts?.status) query.status = opts.status;
      let q = this.model.find(query).sort({ createdAt: -1 });
      if (opts?.skip) q = q.skip(opts.skip);
      if (opts?.limit) q = q.limit(opts.limit);
      const docs = await q.exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findAll(
    opts: { status?: string; limit: number; skip: number },
  ): Promise<Result<Booking[], Error>> {
    try {
      const query: Record<string, unknown> = {};
      if (opts.status) query.status = opts.status;
      const docs = await this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findDispatchReady(
    beforeDate: Date,
    limit = 100,
  ): Promise<Result<Booking[], Error>> {
    try {
      const docs = await this.model
        .find({
          serviceType: 'transport',
          status: { $in: ['pending', 'confirmed'] },
          startDate: { $lte: beforeDate },
          // Idempotencia: solo bookings sin ride disparado todavía. El
          // partial index del schema acelera esta query (lo definimos
          // exactamente con este shape).
          $or: [
            { triggeredRideId: { $exists: false } },
            { triggeredRideId: null },
          ],
        })
        .sort({ startDate: 1 })  // primero los más urgentes
        .limit(limit)
        .exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }

  async findByUserIdPaginated(
    userId: UUID,
    pagination?: PaginationDto
  ): Promise<Result<PaginatedResult<Booking>, Error>> {
    try {
      const { skip, limit } = getPaginationOptions(pagination);
      const [docs, total] = await Promise.all([
        this.model
          .find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments({ userId }),
      ]);
      return ok(
        createPaginatedResponse(docs.map(this.toDomain), total, skip, limit)
      );
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByServiceId(
    serviceId: UUID,
    serviceType: ServiceType
  ): Promise<Result<Booking[], Error>> {
    try {
      const docs = await this.model.find({ serviceId, serviceType }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByServiceIdPaginated(
    serviceId: UUID,
    serviceType: ServiceType,
    pagination?: PaginationDto
  ): Promise<Result<PaginatedResult<Booking>, Error>> {
    try {
      const { skip, limit } = getPaginationOptions(pagination);
      const [docs, total] = await Promise.all([
        this.model
          .find({ serviceId, serviceType })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments({ serviceId, serviceType }),
      ]);
      return ok(
        createPaginatedResponse(docs.map(this.toDomain), total, skip, limit)
      );
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  // Convierte el documento de Mongoose de vuelta a una Entidad de Dominio
  private toDomain(doc: BookingDocument): Booking {
    return Booking.fromPrimitives(doc.toObject() as any);
  }
}
