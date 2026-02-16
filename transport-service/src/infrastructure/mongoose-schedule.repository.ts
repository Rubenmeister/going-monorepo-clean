import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Schedule, IScheduleRepository, DayOfWeek, ServiceType } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ScheduleDocument, ScheduleModelSchema } from './schemas/schedule.schema';

@Injectable()
export class MongooseScheduleRepository implements IScheduleRepository {
  constructor(
    @InjectModel(ScheduleModelSchema.name)
    private readonly model: Model<ScheduleDocument>,
  ) {}

  async save(schedule: Schedule): Promise<Result<void, Error>> {
    try {
      const newDoc = new this.model(schedule.toPrimitives());
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(schedule: Schedule): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id: schedule.id }, { $set: schedule.toPrimitives() }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Schedule | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? Schedule.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByRouteId(routeId: UUID): Promise<Result<Schedule[], Error>> {
    try {
      const docs = await this.model.find({ routeId, status: 'active' }).exec();
      return ok(docs.map(d => Schedule.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByVehicleId(vehicleId: UUID): Promise<Result<Schedule[], Error>> {
    try {
      const docs = await this.model.find({ vehicleId, status: 'active' }).exec();
      return ok(docs.map(d => Schedule.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByDriverId(driverId: UUID): Promise<Result<Schedule[], Error>> {
    try {
      const docs = await this.model.find({ driverId, status: 'active' }).exec();
      return ok(docs.map(d => Schedule.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveByDayAndServiceType(
    day: DayOfWeek,
    serviceType: ServiceType,
  ): Promise<Result<Schedule[], Error>> {
    try {
      const query: any = { days: day, status: 'active' };
      if (serviceType === 'MIXED') {
        query.serviceType = { $in: ['PASSENGER', 'DELIVERY', 'MIXED'] };
      } else {
        query.serviceType = { $in: [serviceType, 'MIXED'] };
      }
      const docs = await this.model.find(query).exec();
      return ok(docs.map(d => Schedule.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
