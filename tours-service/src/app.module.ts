import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TourApplicationModule } from '@going-monorepo-clean/domains-tour-application';
import { ToursController } from './api/tours.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'tours-service' }),
    InfrastructureModule,
    TourApplicationModule,
  ],
  controllers: [ToursController],
  providers: [],
})
export class AppModule {}