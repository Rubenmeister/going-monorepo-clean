import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
    MongooseModule.forRoot(process.env['ACCOMMODATION_DB_URL'] || 'mongodb://localhost:27017/accommodation'),
    InfrastructureModule,
  ],
  controllers: [AccommodationController],
  providers: [
    CreateAccommodationUseCase,
    SearchAccommodationUseCase,
  ],
})
export class AppModule {}