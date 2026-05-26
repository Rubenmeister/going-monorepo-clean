import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { MongooseBookingRepository } from './mongoose-booking.repository';
import { RecurringTripRepository } from './recurring-trip.repository';
import {
  BookingModelSchema,
  BookingSchema,
} from './persistence/schemas/booking.schema';
import {
  RecurringTripModelSchema,
  RecurringTripSchema,
} from './persistence/schemas/recurring-trip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingModelSchema.name, schema: BookingSchema },
      { name: RecurringTripModelSchema.name, schema: RecurringTripSchema },
    ]),
  ],
  providers: [
    {
      provide: IBookingRepository, // El Symbol/Token
      useClass: MongooseBookingRepository, // La implementación concreta
    },
    RecurringTripRepository,
  ],
  exports: [
    IBookingRepository, // Exportamos el Símbolo
    RecurringTripRepository,
  ],
})
export class InfrastructureModule {}
