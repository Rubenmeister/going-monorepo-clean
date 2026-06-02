import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import { Booking, IBookingRepository } from '@going-monorepo-clean/domains-booking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';

@Injectable()
export class FindUserBookingsUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(userId: string): Promise<Result<Booking[], Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;
    return this.bookingRepository.getByUser(userId, token);
  }
}
