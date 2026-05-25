import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  IDriverHybridContextRepository,
  DriverHybridContext,
  DriverHybridState,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  DriverHybridContextDocument,
  DriverHybridContextModelSchema,
} from './schemas/driver-hybrid-context.schema';

/**
 * MongooseDriverHybridContextRepository — implementación Mongo del puerto
 * IDriverHybridContextRepository.
 *
 * Mapeo entity ↔ doc:
 *  - UUIDs viajan como strings (no ObjectId — usamos el id propio).
 *  - Fechas Date se persisten nativamente.
 *  - state es un string libre por el lado del schema; la entity garantiza
 *    que solo asume valores del union DriverHybridState.
 *
 * Errores: capturados y devueltos en err(). Loggea con context para
 * que ops pueda triagear sin abrir Mongo Atlas.
 */
@Injectable()
export class MongooseDriverHybridContextRepository
  implements IDriverHybridContextRepository
{
  private readonly logger = new Logger(
    MongooseDriverHybridContextRepository.name,
  );

  constructor(
    @InjectModel(DriverHybridContextModelSchema.name)
    private readonly model: Model<DriverHybridContextDocument>,
  ) {}

  async save(ctx: DriverHybridContext): Promise<Result<void, Error>> {
    try {
      // Upsert por id propio. El partial-unique index sobre driverId+state
      // garantiza que no quede más de un activo por driver.
      await this.model
        .findOneAndUpdate(
          { id: ctx.id },
          { $set: this.toDoc(ctx) },
          { upsert: true, new: false },
        )
        .exec();
      return ok(undefined);
    } catch (e) {
      this.logger.error(
        `save id=${ctx.id} driver=${ctx.driverId} state=${ctx.state}: ${(e as Error).message}`,
      );
      return err(e as Error);
    }
  }

  async findById(
    id: UUID,
  ): Promise<Result<DriverHybridContext | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).lean().exec();
      return ok(doc ? this.fromDoc(doc as any) : null);
    } catch (e) {
      this.logger.error(`findById ${id}: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async findActiveByDriverId(
    driverId: UUID,
  ): Promise<Result<DriverHybridContext | null, Error>> {
    try {
      const doc = await this.model
        .findOne({
          driverId,
          state: {
            $in: [
              'LONG_TRIP_OUTBOUND',
              'AVAILABLE_LOCAL',
              'BLOCKED_REST',
              'LONG_TRIP_RETURN',
            ],
          },
        })
        .lean()
        .exec();
      return ok(doc ? this.fromDoc(doc as any) : null);
    } catch (e) {
      this.logger.error(
        `findActiveByDriverId ${driverId}: ${(e as Error).message}`,
      );
      return err(e as Error);
    }
  }

  async findByStates(
    states: DriverHybridState[],
    opts?: { limit?: number },
  ): Promise<Result<DriverHybridContext[], Error>> {
    try {
      const docs = await this.model
        .find({ state: { $in: states } })
        .limit(opts?.limit ?? 1000)
        .lean()
        .exec();
      return ok(
        docs.map((d) => this.fromDoc(d as any)),
      );
    } catch (e) {
      this.logger.error(
        `findByStates [${states.join(',')}]: ${(e as Error).message}`,
      );
      return err(e as Error);
    }
  }

  async findReadyForRestWindow(
    now: Date,
  ): Promise<Result<DriverHybridContext[], Error>> {
    try {
      const docs = await this.model
        .find({
          state: 'AVAILABLE_LOCAL',
          restWindowStartsAt: { $ne: null, $lte: now },
        })
        .lean()
        .exec();
      return ok(
        docs.map((d) => this.fromDoc(d as any)),
      );
    } catch (e) {
      this.logger.error(`findReadyForRestWindow: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async findReadyForReturn(
    now: Date,
  ): Promise<Result<DriverHybridContext[], Error>> {
    try {
      const docs = await this.model
        .find({
          state: 'BLOCKED_REST',
          nextLongTripStartTime: { $ne: null, $lte: now },
        })
        .lean()
        .exec();
      return ok(
        docs.map((d) => this.fromDoc(d as any)),
      );
    } catch (e) {
      this.logger.error(`findReadyForReturn: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  // ── Mapeo entity ↔ doc ──────────────────────────────────────────────

  private toDoc(ctx: DriverHybridContext): Partial<DriverHybridContextModelSchema> {
    const p = ctx.toPrimitives();
    return {
      id: p.id,
      driverId: p.driverId,
      state: p.state,
      outboundScheduledTripId: p.outboundScheduledTripId,
      returnScheduledTripId: p.returnScheduledTripId,
      destinationCity: p.destinationCity,
      nextLongTripStartTime: p.nextLongTripStartTime,
      restWindowStartsAt: p.restWindowStartsAt,
      restBufferMinutes: p.restBufferMinutes,
      lastTransitionReason: p.lastTransitionReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private fromDoc(doc: DriverHybridContextDocument): DriverHybridContext {
    return DriverHybridContext.fromPrimitives({
      id: doc.id as UUID,
      driverId: doc.driverId as UUID,
      state: doc.state as DriverHybridState,
      outboundScheduledTripId: (doc.outboundScheduledTripId as UUID | null) ?? null,
      returnScheduledTripId: (doc.returnScheduledTripId as UUID | null) ?? null,
      destinationCity: doc.destinationCity,
      nextLongTripStartTime: doc.nextLongTripStartTime,
      restWindowStartsAt: doc.restWindowStartsAt,
      restBufferMinutes: doc.restBufferMinutes,
      lastTransitionReason: doc.lastTransitionReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
