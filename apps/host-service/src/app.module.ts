import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@going-monorepo/shared-backend';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AccommodationController } from './api/accommodation.controller';
import {
  CreateAccommodationUseCase,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'host-service' }),
    DatabaseModule,
    InfrastructureModule,
  ],
  controllers: [AccommodationController],
  providers: [
    CreateAccommodationUseCase,
    SearchAccommodationUseCase,
  ],
})
export class AppModule {}