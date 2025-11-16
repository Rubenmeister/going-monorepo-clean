import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { MongooseBookingRepository } from './persistence/mongoose-booking.repository';
import {
  BookingModelSchema,
  BookingSchema,
} from './persistence/schemas/booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingModelSchema.name, schema: BookingSchema },
    ]),
  ],
  providers: [
    {
      provide: IBookingRepository, // El Symbol/Token
      useClass: MongooseBookingRepository, // La implementación concreta
    },
  ],
  exports: [
    IBookingRepository, // Exportamos el Símbolo
  ],
})
export class InfrastructureModule {}