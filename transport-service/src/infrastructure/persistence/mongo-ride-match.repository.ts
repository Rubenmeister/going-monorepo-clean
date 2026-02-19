import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  RideMatch as RideMatchEntity,
  IRideMatchRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { RideMatch, RideMatchDocument } from '../schemas/ride-match.schema';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class MongoRideMatchRepository implements IRideMatchRepository {
  private readonly logger = new Logger(MongoRideMatchRepository.name);

  constructor(
    @InjectModel('RideMatch')
    private rideMatchModel: Model<RideMatchDocument>
  ) {}

  async save(match: RideMatchEntity): Promise<Result<void, Error>> {
    try {
      await this.rideMatchModel.create({
        matchId: match.id,
        rideId: match.rideId,
        driverId: match.driverId,
        distance: match.distance,
        eta: match.eta,
        acceptanceStatus: match.acceptanceStatus,
        driverInfo: match.driverInfo,
        createdAt: match.createdAt,
        expiresAt: match.expiresAt,
      });
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to save ride match: ${error.message}`);
      return err(new Error(`Failed to save ride match: ${error.message}`));
    }
  }

  async update(match: RideMatchEntity): Promise<Result<void, Error>> {
    try {
      await this.rideMatchModel.findOneAndUpdate(
        { matchId: match.id },
        {
          acceptanceStatus: match.acceptanceStatus,
          acceptedAt: match.acceptedAt,
          rejectedAt: match.rejectedAt,
        },
        { new: true }
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to update ride match: ${error.message}`);
      return err(new Error(`Failed to update ride match: ${error.message}`));
    }
  }

  async findById(
    matchId: UUID
  ): Promise<Result<RideMatchEntity | null, Error>> {
    try {
      const doc = await this.rideMatchModel.findOne({ matchId });
      if (!doc) {
        return ok(null);
      }
      const entity = this.mapToEntity(doc);
      return ok(entity);
    } catch (error) {
      this.logger.error(`Failed to find ride match: ${error.message}`);
      return err(new Error(`Failed to find ride match: ${error.message}`));
    }
  }

  async findByRideId(rideId: UUID): Promise<Result<RideMatchEntity[], Error>> {
    try {
      const docs = await this.rideMatchModel
        .find({ rideId })
        .sort({ createdAt: -1 });
      const entities = docs.map((doc) => this.mapToEntity(doc));
      return ok(entities);
    } catch (error) {
      this.logger.error(`Failed to find ride matches: ${error.message}`);
      return err(new Error(`Failed to find ride matches: ${error.message}`));
    }
  }

  async findPendingByRideId(
    rideId: UUID
  ): Promise<Result<RideMatchEntity[], Error>> {
    try {
      const docs = await this.rideMatchModel.find({
        rideId,
        acceptanceStatus: 'PENDING',
        expiresAt: { $gt: new Date() },
      });
      const entities = docs.map((doc) => this.mapToEntity(doc));
      return ok(entities);
    } catch (error) {
      this.logger.error(`Failed to find pending matches: ${error.message}`);
      return err(new Error(`Failed to find pending matches: ${error.message}`));
    }
  }

  async findByDriverId(
    driverId: UUID,
    status?: string
  ): Promise<Result<RideMatchEntity[], Error>> {
    try {
      const query: any = { driverId };
      if (status) {
        query.acceptanceStatus = status;
      }
      const docs = await this.rideMatchModel
        .find(query)
        .sort({ createdAt: -1 });
      const entities = docs.map((doc) => this.mapToEntity(doc));
      return ok(entities);
    } catch (error) {
      this.logger.error(`Failed to find driver matches: ${error.message}`);
      return err(new Error(`Failed to find driver matches: ${error.message}`));
    }
  }

  async findAvailableMatches(
    rideId: UUID,
    limit: number
  ): Promise<Result<RideMatchEntity[], Error>> {
    try {
      const docs = await this.rideMatchModel
        .find({
          rideId,
          acceptanceStatus: 'PENDING',
          expiresAt: { $gt: new Date() },
        })
        .sort({ createdAt: -1 })
        .limit(limit);
      const entities = docs.map((doc) => this.mapToEntity(doc));
      return ok(entities);
    } catch (error) {
      this.logger.error(`Failed to find available matches: ${error.message}`);
      return err(
        new Error(`Failed to find available matches: ${error.message}`)
      );
    }
  }

  async expireOldMatches(rideId: UUID): Promise<Result<number, Error>> {
    try {
      const result = await this.rideMatchModel.updateMany(
        {
          rideId,
          acceptanceStatus: 'PENDING',
        },
        { acceptanceStatus: 'EXPIRED' }
      );
      return ok(result.modifiedCount);
    } catch (error) {
      this.logger.error(`Failed to expire old matches: ${error.message}`);
      return err(new Error(`Failed to expire old matches: ${error.message}`));
    }
  }

  async deleteExpiredMatches(olderThan: Date): Promise<Result<number, Error>> {
    try {
      const result = await this.rideMatchModel.deleteMany({
        expiresAt: { $lt: olderThan },
      });
      return ok(result.deletedCount);
    } catch (error) {
      this.logger.error(`Failed to delete expired matches: ${error.message}`);
      return err(
        new Error(`Failed to delete expired matches: ${error.message}`)
      );
    }
  }

  async countPendingForRide(rideId: UUID): Promise<Result<number, Error>> {
    try {
      const count = await this.rideMatchModel.countDocuments({
        rideId,
        acceptanceStatus: 'PENDING',
        expiresAt: { $gt: new Date() },
      });
      return ok(count);
    } catch (error) {
      this.logger.error(`Failed to count pending matches: ${error.message}`);
      return err(
        new Error(`Failed to count pending matches: ${error.message}`)
      );
    }
  }

  async countAcceptedForDriver(driverId: UUID): Promise<Result<number, Error>> {
    try {
      const count = await this.rideMatchModel.countDocuments({
        driverId,
        acceptanceStatus: 'ACCEPTED',
      });
      return ok(count);
    } catch (error) {
      this.logger.error(`Failed to count accepted matches: ${error.message}`);
      return err(
        new Error(`Failed to count accepted matches: ${error.message}`)
      );
    }
  }

  private mapToEntity(doc: RideMatchDocument): RideMatchEntity {
    return RideMatchEntity.fromPrimitives({
      id: doc.matchId,
      rideId: doc.rideId,
      driverId: doc.driverId,
      distance: doc.distance,
      eta: doc.eta,
      acceptanceStatus: doc.acceptanceStatus,
      driverInfo: doc.driverInfo,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      acceptedAt: doc.acceptedAt,
      rejectedAt: doc.rejectedAt,
    });
  }
}
