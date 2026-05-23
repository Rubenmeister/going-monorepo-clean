import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SosController } from './api/sos.controller';
import { IncidentsController } from './api/incidents.controller';
import { HealthController } from './api/health.controller';
import { SosService } from './sos/sos.service';
import { OpsNotifierService } from './sos/ops-notifier.service';
import { TelegramService } from './infrastructure/telegram.service';
import { IncidentRepository } from './infrastructure/persistence/incident.repository';
import { IncidentSchema } from './infrastructure/schemas/incident.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        dbName: 'going-emergency',
        // Mismo patrón conservador que customer-support — timeouts cortos +
        // bufferCommands:false para no colgar el container si Mongo está
        // caído al startup.
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'Incident', schema: IncidentSchema },
    ]),
  ],
  controllers: [
    SosController,
    IncidentsController,
    HealthController,
  ],
  providers: [
    SosService,
    OpsNotifierService,
    TelegramService,
    IncidentRepository,
  ],
})
export class AppModule {}
