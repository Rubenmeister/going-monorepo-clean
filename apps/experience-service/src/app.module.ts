import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@going-monorepo/shared-backend';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ExperienceController } from './api/experience.controller';
import {
  CreateExperienceUseCase,
  SearchExperiencesUseCase,
  DeleteExperienceUseCase,
  FindAllExperiencesUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'experience-service' }),
    DatabaseModule,
    InfrastructureModule,
  ],
  controllers: [ExperienceController],
  providers: [
    CreateExperienceUseCase,
    SearchExperiencesUseCase,
    DeleteExperienceUseCase,
    FindAllExperiencesUseCase,
  ],
})
export class AppModule {}