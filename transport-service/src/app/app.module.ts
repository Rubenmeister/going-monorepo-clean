import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
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
  RecordDriverAcceptanceUseCase,
  GetDriverFairnessUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import {
  IZoneRepository,
  IDriverBaseRepository,
  IDriverHybridContextRepository,
  IDriverComplianceRepository,
  IFairnessCounterRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { MongooseZoneRepository } from '../infrastructure/persistence/mongoose-zone.repository';
import { MongooseDriverBaseRepository } from '../infrastructure/persistence/mongoose-driver-base.repository';
import { MongooseDriverHybridContextRepository } from '../infrastructure/persistence/mongoose-driver-hybrid-context.repository';
import { MongoDriverComplianceRepository } from '../infrastructure/persistence/mongo-driver-compliance.repository';
import { RedisFairnessCounterRepository } from '../infrastructure/persistence/redis-fairness-counter.repository';
import {
  ZoneModelSchema,
  ZoneSchema,
} from '../infrastructure/persistence/schemas/zone.schema';
import {
  DriverBaseModelSchema,
  DriverBaseSchema,
} from '../infrastructure/persistence/schemas/driver-base.schema';
import {
  DriverHybridContextModelSchema,
  DriverHybridContextSchema,
} from '../infrastructure/persistence/schemas/driver-hybrid-context.schema';
import {
  DriverPushTokenModelSchema,
  DriverPushTokenSchema,
} from '../infrastructure/persistence/schemas/driver-push-token.schema';
import { DriverPushTokenController } from '../api/driver-push-token.controller';
import { ExpoPushService } from '../infrastructure/services/expo-push.service';
import { ZoneController } from '../api/zone.controller';
import { DriverBaseController } from '../api/driver-base.controller';
import { TransportController } from '../api/transport.controller';
import { RideController } from '../api/ride.controller';
import { RideInternalController } from '../api/ride-internal.controller';
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
import { DriverHybridController } from '../api/driver-hybrid.controller';
import { DriverComplianceAdminController } from '../api/driver-compliance-admin.controller';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
  UnifiedSearchUseCase,
} from '../application/use-cases';
import { DriverHybridLifecycleService } from '@going-monorepo-clean/domains-transport-application';
import { SearchController } from '../api/search.controller';
import { ScheduledTripController, ScheduledTripInternalController } from '../api/scheduled-trip.controller';
import { InternalServiceGuard } from '../api/internal-service.guard';
import { AdminStubsController } from '../api/admin-stubs.controller';
import { ScheduledTripService } from '../application/scheduled-trip.service';
import { DriverAssignmentService } from '../application/driver-assignment.service';
import { AssignmentAdminController } from '../api/assignment-admin.controller';
import { DriverHybridTransitionCronService } from '../application/driver-hybrid-transition.cron';
import { RideNoShowCronService } from '../application/ride-no-show.cron';
import { DriverComplianceCronService } from '../application/driver-compliance.cron';
import { RideMatchingService } from '../application/ride-matching.service';
import { ScheduledRideDispatcherCron } from '../application/scheduled-ride-dispatcher.cron';
import { ScheduledRideReminderCron } from '../application/scheduled-ride-reminder.cron';
import { ScheduledTripAssignmentCron } from '../application/scheduled-trip-assignment.cron';
import { PrivateRideAssignmentCron } from '../application/private-ride-assignment.cron';
import { OutboxNotifier } from '../application/outbox-notifier.service';
import { PricingService } from 'pricing';
import { PricingClient } from '../infrastructure/pricing-client';
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
        // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
        dbName: process.env.MONGO_DB_NAME || 'going-transport',
        // bufferCommands DEFAULT (true) permite que la module init
        // retorne inmediatamente — las queries se encolan hasta que
        // Mongoose abra la conexión. Sin esto + serverSelectionTimeoutMS
        // bajo, el container muere antes de listen-on-port.
        // Cold-start Cloud Run + SRV lookup Atlas tarda 20-25s.
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        // bufferCommands: undefined → default true (queue durante connect).
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
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
    MongooseModule.forFeature([
      { name: ZoneModelSchema.name, schema: ZoneSchema },
      { name: DriverBaseModelSchema.name, schema: DriverBaseSchema },
      { name: DriverHybridContextModelSchema.name, schema: DriverHybridContextSchema },
      { name: DriverPushTokenModelSchema.name, schema: DriverPushTokenSchema },
    ]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10MB max
    // Habilita @Cron decorators (DriverHybridTransitionCronService).
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AppController,
    TransportController,
    RideController,
    RideInternalController,
    HealthController,
    PaymentController,
    DriverController,
    DriverScheduleController,
    ZoneController,
    DriverBaseController,
    DriverPushTokenController,
    SearchController,
    ScheduledTripController,
    ScheduledTripInternalController,
    AdminStubsController,
    DriverHybridController,
    DriverComplianceAdminController,
    AssignmentAdminController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppService,
    JwtStrategy,
    InternalServiceGuard,
    RequestTripUseCase,
    AcceptTripUseCase,
    MatchAvailableDriversUseCase,
    RideDispatchGateway,
    RideEventsGateway,
    ExpoPushService,
    RequestRideUseCase,
    AcceptRideUseCase,
    CompleteRideUseCase,
    UnifiedSearchUseCase,
    ScheduledTripService,
    DriverAssignmentService,
    PricingService,
    PricingClient,
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
    {
      provide: IDriverHybridContextRepository,
      useClass: MongooseDriverHybridContextRepository,
    },
    {
      provide: IDriverComplianceRepository,
      useClass: MongoDriverComplianceRepository,
    },
    DriverHybridLifecycleService,
    DriverHybridTransitionCronService,
    RideNoShowCronService,
    DriverComplianceCronService,
    RideMatchingService,
    ScheduledRideDispatcherCron,
    ScheduledRideReminderCron,
    ScheduledTripAssignmentCron,
    PrivateRideAssignmentCron,
    OutboxNotifier,
    AssignDriverBaseUseCase,
    UpdateDriverBaseUseCase,
    DeleteDriverBaseUseCase,
    ListDriverBasesUseCase,
    FindDriversNearBaseUseCase,
    // Fairness counter — Fase 3 (tie-break por carga distribuida)
    {
      provide: IFairnessCounterRepository,
      useClass: RedisFairnessCounterRepository,
    },
    RecordDriverAcceptanceUseCase,
    GetDriverFairnessUseCase,
  ],
})
export class AppModule {}
