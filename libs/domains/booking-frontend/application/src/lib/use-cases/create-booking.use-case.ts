import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money } from '@going-monorepo-clean/shared-domain';

export interface BookingViewModel {
  id: string;
  totalPrice: number;
  serviceType: string;
  status: string;
  startDate: Date;
}

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: CreateBookingDto, token: string): Promise<Result<BookingViewModel, Error>> {
    const priceVOResult = Money.create(dto.totalPrice.amount, dto.totalPrice.currency);
    if (priceVOResult.isErr()) return err(priceVOResult.error);

    const result = await this.bookingRepository.create(
      {
        userId: dto.userId,
        serviceId: dto.serviceId,
        serviceType: dto.serviceType,
        totalPrice: priceVOResult.value.toPrimitives(),
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      token,
    );

    if (result.isErr()) return err(result.error);

    const booking = result.value;
    const viewModel: BookingViewModel = {
      id: booking.id,
      totalPrice: booking.totalPrice.amount / 100,
      serviceType: booking.serviceType,
      status: booking.status,
      startDate: booking.startDate,
    };

    return ok(viewModel);
  }
}
