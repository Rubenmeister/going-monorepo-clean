import { Inject, Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import {
  Location,
  LocationHistory,
  ILocationHistoryRepository,
} from '@going-monorepo-clean/domains-tracking-core';
import { SaveLocationHistoryDto } from '../dto/save-location-history.dto';

@Injectable()
export class SaveLocationHistoryUseCase {
  private readonly logger = new Logger(SaveLocationHistoryUseCase.name);

  constructor(
    @Inject(ILocationHistoryRepository)
    private readonly historyRepo: ILocationHistoryRepository,
  ) {}

  async execute(dto: SaveLocationHistoryDto): Promise<void> {
    const locationResult = Location.create({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    if (locationResult.isErr()) {
      throw new BadRequestException(locationResult.error.message);
    }

    const record = LocationHistory.create({
      driverId: dto.driverId,
      tripId: dto.tripId,
      location: locationResult.value,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
    });

    const saveResult = await this.historyRepo.save(record);
    if (saveResult.isErr()) {
      this.logger.error(`Failed to save location history: ${saveResult.error.message}`);
      throw new InternalServerErrorException(saveResult.error.message);
    }
  }
}
