import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

// Importa los Controladores
import { BookingController } from './api/booking.controller';

// Importa los Casos de Uso
import {
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
} from '@going-monorepo-clean/domains-booking-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.BOOKING_DB_URL), // .env
    InfrastructureModule, // Importa el módulo que provee los repositorios
  ],
  controllers: [
    BookingController,
  ],
  providers: [
    // Registra los Casos de Uso como 'providers'
    CreateBookingUseCase,
    FindBookingsByUserUseCase,
  ],
})
export class AppModule {}