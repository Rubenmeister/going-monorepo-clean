import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialController } from './social.controller';
import { HealthController } from './health.controller';
import { SocialService } from './social.service';
import { GamificationStatsSchema, GamificationStatsSchemaDefinition } from './infrastructure/schemas/gamification.schema';
import { GamificationRepository } from './infrastructure/persistence/gamification.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MONGO_URL primero: es el env estándar de los servicios en Cloud Run
    // (este servicio no tenía NINGÚN env de Mongo mapeado — se agrega con la migración).
    MongooseModule.forRoot(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/social', {
      // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
      dbName: process.env.MONGO_DB_NAME || 'going-social',
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB social:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: GamificationStatsSchema.name, schema: GamificationStatsSchemaDefinition },
    ]),
  ],
  controllers: [SocialController, HealthController],
  providers: [SocialService, GamificationRepository],
})
export class AppModule {}
