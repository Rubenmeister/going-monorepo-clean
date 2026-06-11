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
    // MONGO_URL primero: es el env estándar mapeado a secret en Cloud Run.
    // (Pendiente saneo: este servicio tenía la URI con credenciales en texto
    // plano en MONGODB_URI/MONGODB_URL — se reemplazan por el secret MONGO_URL.)
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/going_analytics',
      {
        // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
        dbName: process.env.MONGO_DB_NAME || 'going-analytics',
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
