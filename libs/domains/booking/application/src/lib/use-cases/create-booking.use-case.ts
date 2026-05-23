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
    const priceVO = Money.fromPrimitives(dto.totalPrice);

    const bookingResult = Booking.create({
      userId: dto.userId,
      serviceId: dto.serviceId,
      serviceType: dto.serviceType,
      bookingType: dto.bookingType,
      totalPrice: priceVO,
      startDate: dto.startDate,
      endDate: dto.endDate,
      companyId: dto.companyId,
      clientSegment: dto.clientSegment,
      paymentMode: dto.paymentMode,
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
