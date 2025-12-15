import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ObservabilityModule } from '@going/shared/observability';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Observability: logging, correlation IDs, health checks
    ObservabilityModule.forRoot({
      serviceName: 'api-gateway',
    }),
    
    // Rate limiting: 100 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    AuthModule,
    ProxyModule,
    TrackingModule,
  ],
  providers: [
    // Apply rate limiting globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
