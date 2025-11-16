import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ExperienceController } from './api/experience.controller';
import {
  CreateExperienceUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.EXPERIENCE_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [ExperienceController],
  providers: [
    CreateExperienceUseCase,
    // (Aquí añadirías más Casos de Uso)
  ],
})
export class AppModule {}