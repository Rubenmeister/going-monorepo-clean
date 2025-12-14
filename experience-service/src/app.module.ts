import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ExperienceController } from './api/experience.controller';
import {
  CreateExperienceUseCase,
  SearchExperiencesUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'experience-service' }),
    MongooseModule.forRoot(process.env['EXPERIENCE_DB_URL'] || 'mongodb://localhost:27017/experiences'),
    InfrastructureModule,
  ],
  controllers: [ExperienceController],
  providers: [
    CreateExperienceUseCase,
    SearchExperiencesUseCase,
  ],
})
export class AppModule {}