import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademyController } from './academy.controller';
import { HealthController } from './health.controller';
import { AcademyService } from './academy.service';
import {
  AcademyProgressSchema,
  AcademyProgressSchemaDefinition,
} from './infrastructure/schemas/academy-progress.schema';
import { AcademyProgressRepository } from './infrastructure/persistence/academy-progress.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MONGO_URL es el env estándar de los servicios en Cloud Run. dbName
    // nombrada 'going-academy' — sin esto Mongo cae en la default `test`.
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/academy',
      {
        dbName: process.env.MONGO_DB_NAME || 'going-academy',
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e: any) => console.warn('MongoDB academy:', e.message));
          return conn;
        },
      },
    ),
    MongooseModule.forFeature([
      { name: AcademyProgressSchema.name, schema: AcademyProgressSchemaDefinition },
    ]),
  ],
  controllers: [AcademyController, HealthController],
  providers: [AcademyService, AcademyProgressRepository],
})
export class AppModule {}
