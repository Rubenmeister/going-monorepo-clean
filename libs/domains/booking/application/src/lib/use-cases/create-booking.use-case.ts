import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(dto: CreateBookingDto): Promise<{ id: string }> {
    const priceVO = new Money(dto.totalPrice.amount, dto.totalPrice.currency as 'USD');

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
    return { id: booking.id };
  }
}
