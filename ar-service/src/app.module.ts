import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ArController } from './api/ar.controller';
import { HealthController } from './api/health.controller';
import { ArService } from './application/ar.service';
import { PoiSchema, PoiSchemaDefinition } from './infrastructure/schemas/poi.schema';
import { PoiRepository } from './infrastructure/persistence/poi.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.AR_DB_URL || 'mongodb://localhost:27017/ar', {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: PoiSchema.name, schema: PoiSchemaDefinition },
    ]),
  ],
  controllers: [ArController, HealthController],
  providers: [ArService, PoiRepository],
})
export class AppModule {}
