import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TransportController } from './api/transport.controller';
import { HealthController } from './api/health.controller';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TRANSPORT_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }), // .env
    InfrastructureModule,
  ],
  controllers: [TransportController, HealthController],
  providers: [RequestTripUseCase, AcceptTripUseCase],
})
export class AppModule {}
