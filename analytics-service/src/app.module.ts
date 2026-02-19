import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RideAnalyticsSchema } from './infrastructure/schemas/ride-analytics.schema';
import { DriverAnalyticsSchema } from './infrastructure/schemas/driver-analytics.schema';
import { MongoRideAnalyticsRepository } from './infrastructure/persistence/mongo-ride-analytics.repository';
import { MongoDriverAnalyticsRepository } from './infrastructure/persistence/mongo-driver-analytics.repository';
import { AnalyticsController } from './api/controllers/analytics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/going_analytics',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'RideAnalytics', schema: RideAnalyticsSchema },
      { name: 'DriverAnalytics', schema: DriverAnalyticsSchema },
    ]),
  ],
  providers: [MongoRideAnalyticsRepository, MongoDriverAnalyticsRepository],
  controllers: [AnalyticsController],
  exports: [MongoRideAnalyticsRepository, MongoDriverAnalyticsRepository],
})
export class AppModule {}
