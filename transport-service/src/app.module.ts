import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { RideMatchingModule } from './matching.module';
import { TransportController } from './api/transport.controller';
import { HealthController } from './api/health.controller';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
} from './application/use-cases';
import { TwilioProxyService } from './infrastructure/twilio-proxy.service';
import { AgoraTokenService } from './infrastructure/agora-token.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TRANSPORT_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    InfrastructureModule,
    RideMatchingModule,
  ],
  controllers: [TransportController, HealthController],
  providers: [
    // Legacy domain use cases (used by TransportController)
    RequestTripUseCase,
    AcceptTripUseCase,
    // Service-level use cases (used by RideController via RideMatchingModule)
    RequestRideUseCase,
    AcceptRideUseCase,
    CompleteRideUseCase,
    // Communication services
    TwilioProxyService,
    AgoraTokenService,
  ],
})
export class AppModule {}
