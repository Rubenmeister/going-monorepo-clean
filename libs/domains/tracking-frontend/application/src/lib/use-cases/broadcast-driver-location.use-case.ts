import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import { IDriverLocationRepository } from '@going-monorepo-clean/domains-tracking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class BroadcastDriverLocationUseCase {
  constructor(
    @Inject(IDriverLocationRepository)
    private readonly locationRepository: IDriverLocationRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: LocationUpdateDto): Promise<Result<void, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;

    return this.locationRepository.updateLocation(
      { driverId: dto.driverId, latitude: dto.latitude, longitude: dto.longitude },
      token,
    );
  }
}
