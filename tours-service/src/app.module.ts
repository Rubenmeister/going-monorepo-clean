import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TourController } from './api/tour.controller';
import {
  CreateTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TOURS_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [TourController],
  providers: [
    CreateTourUseCase,
    SearchToursUseCase,
  ],
})
export class AppModule {}