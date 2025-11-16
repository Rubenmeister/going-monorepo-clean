import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { MongooseParcelRepository } from './persistence/mongoose-parcel.repository';
import {
  ParcelModelSchema,
  ParcelSchema,
} from './persistence/schemas/parcel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParcelModelSchema.name, schema: ParcelSchema },
    ]),
  ],
  providers: [
    {
      provide: IParcelRepository,
      useClass: MongooseParcelRepository,
    },
  ],
  exports: [IParcelRepository],
})
export class InfrastructureModule {}