import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

// Importa los Controladores
import { BookingController } from './api/booking.controller';
import { HealthController } from './api/health.controller';

// Importa los Casos de Uso
import {
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.BOOKING_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }), // .env
    InfrastructureModule, // Importa el módulo que provee los repositorios
  ],
  controllers: [BookingController, HealthController],
  providers: [
    // Registra los Casos de Uso como 'providers'
    CreateBookingUseCase,
    FindBookingsByUserUseCase,
    ConfirmBookingUseCase,
    CancelBookingUseCase,
  ],
})
export class AppModule {}
