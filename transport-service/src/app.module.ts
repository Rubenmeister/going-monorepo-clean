import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TransportController } from './api/transport.controller';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TRANSPORT_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [
    TransportController,
  ],
  providers: [
    RequestTripUseCase,
    AcceptTripUseCase,
  ],
})
export class AppModule {}