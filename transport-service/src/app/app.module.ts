import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
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
  CreateZoneUseCase,
  UpdateZoneUseCase,
  DeleteZoneUseCase,
  ListZonesUseCase,
  FindZonesContainingPointUseCase,
  AssignDriverBaseUseCase,
  UpdateDriverBaseUseCase,
  DeleteDriverBaseUseCase,
  ListDriverBasesUseCase,
  FindDriversNearBaseUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import {
  IZoneRepository,
  IDriverBaseRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { MongooseZoneRepository } from '../infrastructure/persistence/mongoose-zone.repository';
import { MongooseDriverBaseRepository } from '../infrastructure/persistence/mongoose-driver-base.repository';
import {
  ZoneModelSchema,
  ZoneSchema,
} from '../infrastructure/persistence/schemas/zone.schema';
import {
  DriverBaseModelSchema,
  DriverBaseSchema,
} from '../infrastructure/persistence/schemas/driver-base.schema';
import { ZoneController } from '../api/zone.controller';
import { DriverBaseController } from '../api/driver-base.controller';
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
    HttpModule,
    ThrottlerModule.forRoot([{
      name:  'default',
      ttl:   60_000, // ventana de 1 minuto
      limit: 60,     // 60 req/min por defecto para todos los endpoints
    }]),
    MongooseModule.forRoot(
      process.env.TRANSPORT_DB_URL ||
        process.env.MONGO_URL ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/transport-db',
      {
        // `lazyConnection: true` no era opción válida de Mongoose y
        // quedaba ignorada — sin timeouts, las queries se buffereaban
        // hasta el default 10s y devolvían 500. Misma configuración
        // que user-auth-service que conecta OK.
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectionFactory: (conn) => {
          conn.on('connected', () =>
            console.log('MongoDB connected (transport)'),
          );
          conn.on('error', (e) =>
            console.error('MongoDB transport error:', e.message),
          );
          conn.on('disconnected', () =>
            console.warn('MongoDB transport disconnected'),
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
    MongooseModule.forFeature([
      { name: ZoneModelSchema.name, schema: ZoneSchema },
      { name: DriverBaseModelSchema.name, schema: DriverBaseSchema },
    ]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10MB max
  ],
  controllers: [
    AppController,
    TransportController,
    RideController,
    HealthController,
    PaymentController,
    DriverController,
    DriverScheduleController,
    ZoneController,
    DriverBaseController,
  ],
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
    // Zone (geocercas) — Fase 1 asignación de conductores
    { provide: IZoneRepository, useClass: MongooseZoneRepository },
    CreateZoneUseCase,
    UpdateZoneUseCase,
    DeleteZoneUseCase,
    ListZonesUseCase,
    FindZonesContainingPointUseCase,
    // DriverBase — Fase 2 asignación de conductores
    { provide: IDriverBaseRepository, useClass: MongooseDriverBaseRepository },
    AssignDriverBaseUseCase,
    UpdateDriverBaseUseCase,
    DeleteDriverBaseUseCase,
    ListDriverBasesUseCase,
    FindDriversNearBaseUseCase,
  ],
})
export class AppModule {}
