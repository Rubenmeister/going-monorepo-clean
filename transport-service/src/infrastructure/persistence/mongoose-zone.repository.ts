import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  IZoneRepository,
  Zone,
  ZoneKind,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ZoneDocument, ZoneModelSchema } from './schemas/zone.schema';

/**
 * MongooseZoneRepository — implementación del port IZoneRepository.
 *
 * Storage layout:
 *   - El polygon se guarda como GeoJSON (`{type:'Polygon', coordinates:[[[lng,lat]...]]}`)
 *     con índice 2dsphere → `$geoIntersects` funciona nativo.
 *   - La entidad Zone del dominio usa `polygon: [[lng,lat]...]` (ring simple).
 *     Aquí traducimos entre ambos formatos.
 */
@Injectable()
export class MongooseZoneRepository implements IZoneRepository {
  private readonly logger = new Logger(MongooseZoneRepository.name);

  constructor(
    @InjectModel(ZoneModelSchema.name)
    private readonly model: Model<ZoneDocument>,
  ) {}

  async save(zone: Zone): Promise<Result<void, Error>> {
    try {
      await this.model.create(this.toDoc(zone));
      return ok(undefined);
    } catch (e) {
      this.logger.error(`save ${zone.id}: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async update(zone: Zone): Promise<Result<void, Error>> {
    try {
      const res = await this.model
        .updateOne({ id: zone.id }, { $set: this.toDoc(zone) })
        .exec();
      if (res.matchedCount === 0) {
        return err(new Error(`Zone ${zone.id} not found`));
      }
      return ok(undefined);
    } catch (e) {
      this.logger.error(`update ${zone.id}: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async delete(id: UUID): Promise<Result<void, Error>> {
    try {
      const res = await this.model.deleteOne({ id }).exec();
      if (res.deletedCount === 0) {
        return err(new Error(`Zone ${id} not found`));
      }
      return ok(undefined);
    } catch (e) {
      return err(e as Error);
    }
  }

  async findById(id: UUID): Promise<Result<Zone | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).lean().exec();
      return ok(doc ? this.fromDoc(doc as any) : null);
    } catch (e) {
      return err(e as Error);
    }
  }

  async findAll(opts?: {
    kind?: ZoneKind;
    active?: boolean;
  }): Promise<Result<Zone[], Error>> {
    try {
      const q: any = {};
      if (opts?.kind) q.kind = opts.kind;
      if (opts?.active !== undefined) q.active = opts.active;
      const docs = await this.model.find(q).lean().exec();
      return ok(docs.map((d: any) => this.fromDoc(d)));
    } catch (e) {
      return err(e as Error);
    }
  }

  async findContainingPoint(
    lng: number,
    lat: number,
  ): Promise<Result<Zone[], Error>> {
    try {
      const docs = await this.model
        .find({
          active: true,
          geometry: {
            $geoIntersects: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
            },
          },
        })
        .lean()
        .exec();
      return ok(docs.map((d: any) => this.fromDoc(d)));
    } catch (e) {
      this.logger.error(
        `findContainingPoint(${lng},${lat}): ${(e as Error).message}`,
      );
      return err(e as Error);
    }
  }

  // ── Mappers ──────────────────────────────────────────────────────────

  private toDoc(zone: Zone): Partial<ZoneModelSchema> {
    const p = zone.toPrimitives();
    return {
      id: p.id,
      name: p.name,
      kind: p.kind,
      geometry: {
        type: 'Polygon',
        // GeoJSON Polygon: outer ring wrapped in an array.
        coordinates: [p.polygon as unknown as number[][]],
      },
      surchargePct: p.surchargePct,
      notes: p.notes,
      active: p.active,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private fromDoc(doc: ZoneModelSchema): Zone {
    const ring = doc.geometry?.coordinates?.[0] ?? [];
    return Zone.fromPrimitives({
      id: doc.id as UUID,
      name: doc.name,
      kind: doc.kind,
      polygon: ring as Array<[number, number]>,
      surchargePct: doc.surchargePct,
      notes: doc.notes,
      active: doc.active,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
