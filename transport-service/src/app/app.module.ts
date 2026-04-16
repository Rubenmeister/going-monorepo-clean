import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
  MatchAvailableDriversUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { TransportController } from '../api/transport.controller';
import { RideController } from '../api/ride.controller';
import { HealthController } from '../api/health.controller';
import { TwilioProxyService } from '../infrastructure/twilio-proxy.service';
import { AgoraTokenService } from '../infrastructure/agora-token.service';
import { DistanceCalculatorService } from '../domain/ports';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { RideDispatchGateway } from '../infrastructure/gateways/ride-dispatch.gateway';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';
import { DatafastProvider } from '../infrastructure/payment/datafast.provider';
import { DeUnaProvider } from '../infrastructure/payment/deuna.provider';
import { MockPaymentProvider } from '../infrastructure/payment/mock-payment.provider';
import { PaymentGatewayService } from '../infrastructure/payment/payment-gateway.service';
import { PaymentController } from '../api/payment.controller';
import { DriverController } from '../api/driver.controller';
import { DriverScheduleController } from '../api/driver-schedule.controller';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
} from '../application/use-cases';
import { TokenService } from '../infrastructure/token.service';
import { MulterModule } from '@nestjs/platform-express';

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
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10MB max
  ],
  controllers: [AppController, TransportController, RideController, HealthController, PaymentController, DriverController, DriverScheduleController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppService,
    JwtStrategy,
    RequestTripUseCase,
    AcceptTripUseCase,
    MatchAvailableDriversUseCase,
    RideDispatchGateway,
    RideEventsGateway,
    RequestRideUseCase,
    AcceptRideUseCase,
    CompleteRideUseCase,
    TwilioProxyService,
    AgoraTokenService,
    DatafastProvider,
    DeUnaProvider,
    MockPaymentProvider,
    PaymentGatewayService,
    DistanceCalculatorService,
    TokenService,
  ],
})
export class AppModule {}
