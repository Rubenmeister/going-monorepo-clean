import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ICourseRepository } from '@going-monorepo-clean/domains-academy-core';
import { MongooseCourseRepository } from './mongoose-course.repository';
import {
  CourseModelSchema,
  CourseSchema,
} from './course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseModelSchema.name, schema: CourseSchema },
    ]),
  ],
  providers: [
    {
      provide: ICourseRepository,
      useClass: MongooseCourseRepository,
    },
  ],
  exports: [ICourseRepository],
})
export class InfrastructureModule {}
