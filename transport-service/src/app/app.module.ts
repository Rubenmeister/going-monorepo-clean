import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { TransportController } from '../api/transport.controller';
import { RideController } from '../api/ride.controller';
import { TwilioProxyService } from '../infrastructure/twilio-proxy.service';
import { AgoraTokenService } from '../infrastructure/agora-token.service';
import { MatchAvailableDriversUseCase } from '@going-monorepo-clean/domains-transport-application';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
} from '../application/use-cases';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      name:  'default',
      ttl:   60_000, // ventana de 1 minuto
      limit: 60,     // 60 req/min por defecto para todos los endpoints
    }]),
    MongooseModule.forRoot(
      process.env.TRANSPORT_DB_URL ||
        process.env.MONGO_URL ||
        'mongodb://localhost:27017/transport-db',
      {
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) =>
            console.warn('MongoDB transport:', e.message)
          );
          return conn;
        },
      }
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
  ],
  controllers: [AppController, TransportController, RideController],
  providers: [
    // Rate limiting global — ThrottlerGuard aplica los límites del módulo a todos los endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppService,
    RequestTripUseCase,
    AcceptTripUseCase,
    MatchAvailableDriversUseCase,
    RequestRideUseCase,
    AcceptRideUseCase,
    CompleteRideUseCase,
    TwilioProxyService,
    AgoraTokenService,
  ],
})
export class AppModule {}
