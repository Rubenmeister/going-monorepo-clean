import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../libs/shared/src';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ParcelController } from './api/parcel.controller';
import {
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'parcel-service' }),
    DatabaseModule,
    InfrastructureModule,
  ],
  controllers: [
    ParcelController,
  ],
  providers: [
    CreateParcelUseCase,
    FindParcelsByUserUseCase,
  ],
})
export class AppModule {}