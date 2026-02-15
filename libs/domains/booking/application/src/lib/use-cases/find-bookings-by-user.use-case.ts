import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IBookingRepository, BookingStatus, ServiceType } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type UserBookingDto = {
  id: UUID;
  serviceId: UUID;
  serviceType: ServiceType;
  status: BookingStatus;
  totalPrice: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
};

@Injectable()
export class FindBookingsByUserUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(userId: UUID): Promise<UserBookingDto[]> {
    const bookingsResult = await this.bookingRepo.findByUserId(userId);

    if (bookingsResult.isErr()) {
      throw new InternalServerErrorException(bookingsResult.error.message);
    }
    const bookings = bookingsResult.value;

    return bookings.map((booking) => {
      const props = booking.toPrimitives();
      return {
        id: props.id,
        serviceId: props.serviceId,
        serviceType: props.serviceType,
        status: props.status,
        totalPrice: props.totalPrice.amount,
        currency: props.totalPrice.currency,
        startDate: props.startDate,
        endDate: props.endDate,
        createdAt: props.createdAt,
      };
    });
  }
}
