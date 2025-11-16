import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { MongooseAccommodationRepository } from './persistence/mongoose-accommodation.repository';
import {
  AccommodationModelSchema,
  AccommodationSchema,
} from './persistence/schemas/accommodation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccommodationModelSchema.name, schema: AccommodationSchema },
    ]),
  ],
  providers: [
    {
      provide: IAccommodationRepository,
      useClass: MongooseAccommodationRepository,
    },
  ],
  exports: [IAccommodationRepository],
})
export class InfrastructureModule {}