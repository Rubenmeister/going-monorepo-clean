import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RideAnalytics, RideAnalyticsSchema } from './infrastructure/schemas/ride-analytics.schema';
import { DriverAnalytics, DriverAnalyticsSchema } from './infrastructure/schemas/driver-analytics.schema';
import { MongoRideAnalyticsRepository } from './infrastructure/persistence/mongo-ride-analytics.repository';
import { MongoDriverAnalyticsRepository } from './infrastructure/persistence/mongo-driver-analytics.repository';
import { AnalyticsController } from './api/controllers/analytics.controller';
import { HealthController } from './api/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/going_analytics',
      {
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) => console.warn('MongoDB connection error:', e.message));
          return conn;
        },
      }
    ),
    MongooseModule.forFeature([
      { name: RideAnalytics.name, schema: RideAnalyticsSchema },
      { name: DriverAnalytics.name, schema: DriverAnalyticsSchema },
    ]),
  ],
  providers: [MongoRideAnalyticsRepository, MongoDriverAnalyticsRepository],
  controllers: [AnalyticsController, HealthController],
  exports: [MongoRideAnalyticsRepository, MongoDriverAnalyticsRepository],
})
export class AppModule {}
