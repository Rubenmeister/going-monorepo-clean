import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class FindUserBookingsUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(userId: UUID): Promise<Result<Booking[], Error>> {
    // 1. Obtener el token de la sesión actual
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;

    // 2. Llamar al "Puerto" del repositorio
    return this.bookingRepository.getByUser(userId, token);
  }
}