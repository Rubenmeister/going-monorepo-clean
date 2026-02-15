import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ITourRepository } from '@going-monorepo-clean/domains-tour-core';
import { MongooseTourRepository } from './mongoose-tour.repository';
import {
  TourModelSchema,
  TourSchema,
} from './tour.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TourModelSchema.name, schema: TourSchema },
    ]),
  ],
  providers: [
    {
      provide: ITourRepository,
      useClass: MongooseTourRepository,
    },
  ],
  exports: [ITourRepository],
})
export class InfrastructureModule {}