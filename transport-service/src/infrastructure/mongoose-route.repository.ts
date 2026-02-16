import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Route, IRouteRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { RouteDocument, RouteModelSchema } from './schemas/route.schema';

@Injectable()
export class MongooseRouteRepository implements IRouteRepository {
  constructor(
    @InjectModel(RouteModelSchema.name)
    private readonly model: Model<RouteDocument>,
  ) {}

  async save(route: Route): Promise<Result<void, Error>> {
    try {
      const newDoc = new this.model(route.toPrimitives());
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(route: Route): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id: route.id }, { $set: route.toPrimitives() }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Route | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? Route.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveRoutes(): Promise<Result<Route[], Error>> {
    try {
      const docs = await this.model.find({ status: 'active' }).exec();
      return ok(docs.map(d => Route.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByOriginCity(city: string): Promise<Result<Route[], Error>> {
    try {
      const docs = await this.model.find({ 'origin.city': city, status: 'active' }).exec();
      return ok(docs.map(d => Route.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
