import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  IDriverBaseRepository,
  DriverBase,
  DriverBaseWithDistance,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  DriverBaseDocument,
  DriverBaseModelSchema,
} from './schemas/driver-base.schema';

@Injectable()
export class MongooseDriverBaseRepository implements IDriverBaseRepository {
  private readonly logger = new Logger(MongooseDriverBaseRepository.name);

  constructor(
    @InjectModel(DriverBaseModelSchema.name)
    private readonly model: Model<DriverBaseDocument>,
  ) {}

  async save(base: DriverBase): Promise<Result<void, Error>> {
    try {
      await this.model.create(this.toDoc(base));
      return ok(undefined);
    } catch (e) {
      this.logger.error(`save ${base.id}: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async update(base: DriverBase): Promise<Result<void, Error>> {
    try {
      const res = await this.model
        .updateOne({ id: base.id }, { $set: this.toDoc(base) })
        .exec();
      if (res.matchedCount === 0) {
        return err(new Error(`DriverBase ${base.id} not found`));
      }
      return ok(undefined);
    } catch (e) {
      return err(e as Error);
    }
  }

  async delete(id: UUID): Promise<Result<void, Error>> {
    try {
      const res = await this.model.deleteOne({ id }).exec();
      if (res.deletedCount === 0) {
        return err(new Error(`DriverBase ${id} not found`));
      }
      return ok(undefined);
    } catch (e) {
      return err(e as Error);
    }
  }

  async findById(id: UUID): Promise<Result<DriverBase | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).lean().exec();
      return ok(doc ? this.fromDoc(doc as any) : null);
    } catch (e) {
      return err(e as Error);
    }
  }

  async findByDriverId(driverId: UUID): Promise<Result<DriverBase[], Error>> {
    try {
      const docs = await this.model.find({ driverId }).lean().exec();
      return ok(docs.map((d: any) => this.fromDoc(d)));
    } catch (e) {
      return err(e as Error);
    }
  }

  async findPrimaryByDriverId(
    driverId: UUID,
  ): Promise<Result<DriverBase | null, Error>> {
    try {
      const doc = await this.model
        .findOne({ driverId, isPrimary: true, active: true })
        .lean()
        .exec();
      return ok(doc ? this.fromDoc(doc as any) : null);
    } catch (e) {
      return err(e as Error);
    }
  }

  async findBasesNearPoint(
    lat: number,
    lng: number,
    opts?: {
      maxKm?: number;
      maxResults?: number;
      onlyInShift?: boolean;
      now?: Date;
    },
  ): Promise<Result<DriverBaseWithDistance[], Error>> {
    const maxKm = opts?.maxKm ?? 10;
    const maxResults = opts?.maxResults ?? 20;
    const now = opts?.now ?? new Date();

    try {
      // $geoNear con $maxDistance en metros. Devuelve campo `__dist` con
      // la distancia calculada por Mongo (eliminamos cálculo manual).
      const docs = await this.model
        .aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [lng, lat] },
              distanceField: '__distMeters',
              maxDistance: maxKm * 1000,
              spherical: true,
              query: { active: true },
            },
          },
          { $limit: maxResults },
        ])
        .exec();

      const result: DriverBaseWithDistance[] = [];
      for (const d of docs) {
        const base = this.fromDoc(d);
        if (opts?.onlyInShift && !base.isInShift(now)) continue;
        result.push({
          base,
          distanceKm: Math.round((d.__distMeters / 1000) * 100) / 100,
        });
      }
      return ok(result);
    } catch (e) {
      this.logger.error(
        `findBasesNearPoint(${lat},${lng}): ${(e as Error).message}`,
      );
      return err(e as Error);
    }
  }

  // ── Mappers ──────────────────────────────────────────────────────────

  private toDoc(base: DriverBase): Partial<DriverBaseModelSchema> {
    const p = base.toPrimitives();
    return {
      id: p.id,
      driverId: p.driverId,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      // GeoJSON Point para índice 2dsphere — coordinates [lng, lat].
      location: {
        type: 'Point',
        coordinates: [p.lng, p.lat],
      },
      radiusKm: p.radiusKm,
      shiftStart: p.shiftStart,
      shiftEnd: p.shiftEnd,
      isPrimary: p.isPrimary,
      active: p.active,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private fromDoc(doc: DriverBaseModelSchema): DriverBase {
    return DriverBase.fromPrimitives({
      id: doc.id as UUID,
      driverId: doc.driverId as UUID,
      name: doc.name,
      lat: doc.lat,
      lng: doc.lng,
      radiusKm: doc.radiusKm,
      shiftStart: doc.shiftStart,
      shiftEnd: doc.shiftEnd,
      isPrimary: doc.isPrimary,
      active: doc.active,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
