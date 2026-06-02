import { Inject, Injectable } from '@nestjs/common';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly repository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(bookingId: string): Promise<void> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error('No estás autenticado.');
    }
    const token = sessionResult.value.token;

    const result = await this.repository.cancel(bookingId, token);
    if (result.isErr()) {
      throw new Error(result.error.message);
    }
  }
}
