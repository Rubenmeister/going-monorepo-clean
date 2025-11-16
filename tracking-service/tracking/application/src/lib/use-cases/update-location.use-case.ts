import { Inject, Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import {
  Location,
  DriverLocation,
  ITrackingRepository,
  ITrackingGateway,
} from '@going-monorepo-clean/domains-tracking-core';
import { UpdateLocationDto } from '../dto/update-location.dto';

@Injectable()
export class UpdateLocationUseCase {
  private readonly logger = new Logger(UpdateLocationUseCase.name);

  constructor(
    @Inject(ITrackingRepository)
    private readonly trackingRepo: ITrackingRepository,
    @Inject(ITrackingGateway)
    private readonly trackingGateway: ITrackingGateway,
  ) {}

  async execute(dto: UpdateLocationDto): Promise<void> {
    const locationVOResult = Location.create({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    if (locationVOResult.isErr()) {
      throw new BadRequestException(locationVOResult.error.message);
    }

    const driverLocation = DriverLocation.create({
      driverId: dto.driverId,
      location: locationVOResult.value,
    });

    // Guardar en Redis
    const saveResult = await this.trackingRepo.save(driverLocation);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    // Difundir por WebSocket
    const broadcastResult = await this.trackingGateway.broadcastLocationUpdate(driverLocation);
    if (broadcastResult.isErr()) {
      this.logger.error(`Failed to broadcast location: ${broadcastResult.error.message}`);
    }
  }
}