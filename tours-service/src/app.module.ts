import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TourController } from './api/tour.controller';
import { HealthController } from './api/health.controller';
import {
  CreateTourUseCase,
  GetTourByIdUseCase,
  PublishTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TOURS_DB_URL, {
      // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
      dbName: process.env.MONGO_DB_NAME || 'going-tours',
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
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
  controllers: [TourController, HealthController],
  providers: [
    CreateTourUseCase,
    GetTourByIdUseCase,
    PublishTourUseCase,
    SearchToursUseCase,
    JwtStrategy,
  ],
})
export class AppModule {}
