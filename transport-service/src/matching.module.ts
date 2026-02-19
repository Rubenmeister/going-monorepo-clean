import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { RideController } from './api/ride.controller';

// Use Cases
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import { AcceptRideMatchUseCase } from '@going-monorepo-clean/domains-transport-application';
import { RejectRideMatchUseCase } from '@going-monorepo-clean/domains-transport-application';

// Repositories
import { MongoRideMatchRepository } from './infrastructure/persistence/mongo-ride-match.repository';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';

// Gateways
import { RideDispatchGateway } from './infrastructure/gateways/ride-dispatch.gateway';

// Schemas
import { RideMatchSchema } from './infrastructure/schemas/ride-match.schema';

/**
 * Ride Matching Module
 * Wires up all dependencies for ride matching and driver dispatch
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'RideMatch', schema: RideMatchSchema }]),
  ],
  controllers: [RideController],
  providers: [
    // Use Cases
    MatchAvailableDriversUseCase,
    AcceptRideMatchUseCase,
    RejectRideMatchUseCase,

    // Repositories
    {
      provide: IRideMatchRepository,
      useClass: MongoRideMatchRepository,
    },

    // Gateways
    RideDispatchGateway,
  ],
  exports: [
    MatchAvailableDriversUseCase,
    AcceptRideMatchUseCase,
    RejectRideMatchUseCase,
    IRideMatchRepository,
    RideDispatchGateway,
  ],
})
export class RideMatchingModule {}
