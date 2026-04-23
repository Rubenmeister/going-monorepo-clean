import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationController } from './api/recommendation.controller';
import { HealthController } from './api/health.controller';
import { RecommendationService } from './application/recommendation.service';
import { TripHistorySchema, TripHistorySchemaDefinition } from './infrastructure/schemas/trip-history.schema';
import { TripHistoryRepository } from './infrastructure/persistence/trip-history.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.RECOMMENDATION_DB_URL || 'mongodb://localhost:27017/recommendation', {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: TripHistorySchema.name, schema: TripHistorySchemaDefinition },
    ]),
  ],
  controllers: [RecommendationController, HealthController],
  providers: [RecommendationService, TripHistoryRepository],
})
export class AppModule {}
