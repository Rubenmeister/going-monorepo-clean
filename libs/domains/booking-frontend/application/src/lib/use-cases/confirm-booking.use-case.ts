import { Inject, Injectable } from '@nestjs/common';
import { Booking, IBookingRepository } from '@going-monorepo-clean/domains-booking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Result, err } from 'neverthrow';

@Injectable()
export class ConfirmBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly repository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(bookingId: string): Promise<Result<Booking, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;
    return this.repository.confirm(bookingId, token);
  }
}
