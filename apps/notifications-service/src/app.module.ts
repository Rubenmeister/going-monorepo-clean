import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { DeviceTokenController } from './api/device-token.controller';
import { DeviceTokenService } from './app/services/device-token.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'notifications-service' }),
    InfrastructureModule,
  ],
  controllers: [DeviceTokenController],
  providers: [DeviceTokenService],
})
export class AppModule {}