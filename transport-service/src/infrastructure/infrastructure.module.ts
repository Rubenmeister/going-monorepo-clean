import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { MongooseTripRepository } from './persistence/mongoose-trip.repository';
import {
  TripModelSchema,
  TripSchema,
} from './persistence/schemas/trip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TripModelSchema.name, schema: TripSchema },
    ]),
  ],
  providers: [
    {
      provide: ITripRepository,
      useClass: MongooseTripRepository,
    },
  ],
  exports: [ITripRepository],
})
export class InfrastructureModule {}