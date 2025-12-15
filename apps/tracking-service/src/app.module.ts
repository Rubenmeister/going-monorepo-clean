import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'tracking-service' }),
    InfrastructureModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}