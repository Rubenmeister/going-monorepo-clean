import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IExperienceRepository } from '@going-monorepo-clean/domains-experience-core';
import { MongooseExperienceRepository } from './mongoose-experience.repository';
import {
  ExperienceModelSchema,
  ExperienceSchema,
} from './schemas/experience.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExperienceModelSchema.name, schema: ExperienceSchema },
    ]),
  ],
  providers: [
    {
      provide: IExperienceRepository,
      useClass: MongooseExperienceRepository,
    },
  ],
  exports: [IExperienceRepository],
})
export class InfrastructureModule {}