import { Inject, Injectable, InternalServerErrorException, Optional } from '@nestjs/common';
import {
  Booking,
  IBookingRepository,
  BookingCreatedEvent,
} from '@going-monorepo-clean/domains-booking-core';
import { Money, IEventBus } from '@going-monorepo-clean/shared-domain';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
    @Optional() @Inject(IEventBus)
    private readonly eventBus?: IEventBus,
  ) {}

  async execute(dto: CreateBookingDto): Promise<{ id: string }> {
    const priceVO = Money.fromPrimitives({
      amount: dto.totalPrice.amount,
      currency: dto.totalPrice.currency,
    });

    const bookingResult = Booking.create({
      userId: dto.userId,
      serviceId: dto.serviceId,
      serviceType: dto.serviceType,
      totalPrice: priceVO,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    if (bookingResult.isErr()) {
      throw new InternalServerErrorException(bookingResult.error.message);
    }

    const booking = bookingResult.value;
    const saveResult = await this.bookingRepo.save(booking);

    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    // Emit BookingCreatedEvent for the saga orchestrator
    if (this.eventBus) {
      await this.eventBus.publish(
        new BookingCreatedEvent({
          bookingId: booking.id,
          userId: dto.userId,
          serviceId: dto.serviceId,
          serviceType: dto.serviceType,
          totalAmount: dto.totalPrice.amount,
          totalCurrency: dto.totalPrice.currency,
        }),
      );
    }

    return { id: booking.id };
  }
}
