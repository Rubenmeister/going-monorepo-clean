import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import { Trip, ITripRepository } from '@going-monorepo-clean/domains-transport-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';

@Injectable()
export class GetActiveTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepository: ITripRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(userId: string): Promise<Result<Trip | null, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;
    return this.tripRepository.getActiveTrip(userId, token);
  }
}
