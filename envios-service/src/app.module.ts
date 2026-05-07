import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ParcelController } from './api/parcel.controller';
import { HealthController } from './api/health.controller';
import {
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
  TrackParcelUseCase,
  AssignParcelUseCase,
  CancelParcelUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { NearbyDriversService } from './infrastructure/services/nearby-drivers.service';
import { ParcelDispatchGateway } from './infrastructure/gateways/parcel-dispatch.gateway';
import { ParcelMatchingOrchestrator } from './infrastructure/services/parcel-matching-orchestrator.service';
import { PaymentIntentService } from './infrastructure/services/payment-intent.service';
import { SmsService } from './infrastructure/services/sms.service';
import { TrackingClientService } from './infrastructure/services/tracking-client.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.PARCEL_DB_URL ||
        process.env.MONGO_URL ||
        process.env.MONGODB_URI,
      {
        // Timeouts generosos. bufferCommands DEFAULT (true): las queries
        // esperan a que el connect termine. Sin eso + con timeouts altos
        // el startup probe de Cloud Run (4 min) expira antes de que
        // Mongoose resuelva el primer connect.
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        // bufferCommands queda en true (default) — permite requests
        // durante el connect inicial sin throw.
        connectionFactory: (conn) => {
          conn.on('connected', () => console.log('MongoDB connected (envios)'));
          conn.on('error', (e) => console.error('MongoDB error:', e.message));
          conn.on('disconnected', () =>
            console.warn('MongoDB disconnected (envios)'),
          );
          return conn;
        },
      },
    ),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
  ],
  controllers: [ParcelController, HealthController],
  providers: [
    CreateParcelUseCase,
    FindParcelsByUserUseCase,
    TrackParcelUseCase,
    AssignParcelUseCase,
    CancelParcelUseCase,
    JwtStrategy,
    NearbyDriversService,
    ParcelDispatchGateway,
    ParcelMatchingOrchestrator,
    PaymentIntentService,
    SmsService,
    TrackingClientService,
  ],
})
export class AppModule {}
