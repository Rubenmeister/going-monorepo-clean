import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { IEventBus } from '@going-monorepo-clean/shared-domain';
import { MongooseTripRepository } from './mongoose-trip.repository';
import { NestJsEventBus } from './nestjs-event-bus';
import {
  TripModelSchema,
  TripSchema,
} from './schemas/trip.schema';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongooseModule.forFeature([
      { name: TripModelSchema.name, schema: TripSchema },
    ]),
  ],
  providers: [
    {
      provide: ITripRepository,
      useClass: MongooseTripRepository,
    },
    {
      provide: IEventBus,
      useClass: NestJsEventBus,
    },
  ],
  exports: [ITripRepository, IEventBus],
})
export class InfrastructureModule {}
