import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AccommodationController } from './api/accommodation.controller';
import {
  CreateAccommodationUseCase,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.ACCOMMODATION_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [AccommodationController],
  providers: [
    CreateAccommodationUseCase,
    SearchAccommodationUseCase,
  ],
})
export class AppModule {}