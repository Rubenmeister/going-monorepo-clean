import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ParcelController } from './api/parcel.controller';
import {
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PARCEL_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [
    ParcelController,
  ],
  providers: [
    CreateParcelUseCase,
    FindParcelsByUserUseCase,
  ],
})
export class AppModule {}