import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  IDriverLocationRepository,
  LocationData,
} from '@going-monorepo-clean/domains-tracking-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Location } from '@going-monorepo-clean/shared-domain';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class BroadcastDriverLocationUseCase {
  constructor(
    @Inject(IDriverLocationRepository)
    private readonly repository: IDriverLocationRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(dto: LocationUpdateDto): Promise<Result<void, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;

    const locationVOResult = Location.create(dto);
    if (locationVOResult.isErr()) {
      return err(locationVOResult.error);
    }
    
    const locationData: LocationData = {
      driverId: dto.driverId,
      location: locationVOResult.value,
    };

    return this.repository.sendLocation(locationData, token);
  }
}