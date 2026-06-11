import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ApplicationModule } from '../application/application.module';
import { LocationTrackingGateway } from '../infrastructure/gateways/location-tracking.gateway';
import { WebSocketJwtService } from '@going-monorepo-clean/shared-infrastructure';
import { ActiveDriversController } from '../api/active-drivers.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/tracking-db',
      {
        // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
        dbName: process.env.MONGO_DB_NAME || 'going-tracking',
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) => console.warn('MongoDB:', e.message));
          return conn;
        },
      }
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
    ApplicationModule,
  ],
  controllers: [AppController, ActiveDriversController],
  providers: [AppService, LocationTrackingGateway, WebSocketJwtService],
})
export class AppModule {}
