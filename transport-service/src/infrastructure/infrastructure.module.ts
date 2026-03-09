import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Redis } from 'ioredis';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';
import { MongooseTripRepository } from './persistence/mongoose-trip.repository';
import { MongooseRideRepository } from './persistence/mongoose-ride.repository';
import { MongoRideMatchRepository } from './persistence/mongo-ride-match.repository';
import { TripModelSchema, TripSchema } from './persistence/schemas/trip.schema';
import { RideModelSchema, RideSchema } from './persistence/schemas/ride.schema';
import { RideMatchSchema } from './schemas/ride-match.schema';
import { DistanceCalculatorService, GeolocationService } from '../domain/ports';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TripModelSchema.name, schema: TripSchema },
      { name: RideModelSchema.name, schema: RideSchema },
      { name: 'RideMatch', schema: RideMatchSchema },
    ]),
  ],
  providers: [
    {
      provide: ITripRepository,
      useClass: MongooseTripRepository,
    },
    {
      provide: 'IRideRepository',
      useClass: MongooseRideRepository,
    },
    {
      provide: IRideMatchRepository,
      useClass: MongoRideMatchRepository,
    },
    MongooseRideRepository,
    DistanceCalculatorService,
    {
      provide: 'GeolocationService',
      useFactory: (distCalc: DistanceCalculatorService) =>
        new GeolocationService(null, null, distCalc),
      inject: [DistanceCalculatorService],
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return new Redis(url, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0,
          connectTimeout: 3000,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    ITripRepository,
    'IRideRepository',
    IRideMatchRepository,
    'GeolocationService',
    'REDIS_CLIENT',
  ],
})
export class InfrastructureModule {}
