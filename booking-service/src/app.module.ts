import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { BookingController } from './api/booking.controller';
import { HealthController } from './api/health.controller';
import {
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { PricingService } from 'pricing';
import { BookingDispatcherService } from './application/booking-dispatcher.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.BOOKING_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
    // Habilita @Cron en BookingDispatcherService — corre cada 5 min y
    // convierte scheduled corporate bookings en rides reales (task #28).
    ScheduleModule.forRoot(),
  ],
  controllers: [BookingController, HealthController],
  providers: [
    CreateBookingUseCase,
    FindBookingsByUserUseCase,
    ConfirmBookingUseCase,
    CancelBookingUseCase,
    JwtStrategy,
    PricingService,
    BookingDispatcherService,
  ],
})
export class AppModule {}
