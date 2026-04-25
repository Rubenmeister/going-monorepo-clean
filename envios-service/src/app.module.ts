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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.PARCEL_DB_URL ||
        process.env.MONGO_URL ||
        process.env.MONGODB_URI,
      {
        // Timeouts alineados con user-auth-service (que conecta OK al
        // mismo Atlas). `lazyConnection: true` no es opción válida de
        // Mongoose — quedaba ignorado y sin timeouts las conexiones
        // fallaban en silencio causando "buffering timed out" en cada
        // query.
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
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
        secret: config.get('JWT_SECRET', 'default-secret'),
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
  ],
})
export class AppModule {}
