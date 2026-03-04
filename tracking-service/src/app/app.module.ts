import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ApplicationModule } from '../application/application.module';
import { GeoController } from '../api/geo.controller';
import { LocationTrackingGateway } from '../infrastructure/gateways/location-tracking.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/tracking-db',
      {
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) => console.warn('MongoDB:', e.message));
          return conn;
        },
      }
    ),
    InfrastructureModule,
    ApplicationModule,
  ],
  controllers: [AppController, GeoController],
  providers: [AppService, LocationTrackingGateway],
})
export class AppModule {}
