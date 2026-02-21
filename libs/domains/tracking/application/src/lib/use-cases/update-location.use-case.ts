import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ITrackingRepository,
  ITrackingGateway,
  DriverLocation,
  Location,
} from '@going-monorepo-clean/domains-tracking-core';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class UpdateLocationUseCase {
  constructor(
    @Inject(ITrackingRepository)
    private readonly trackingRepository: ITrackingRepository,
    @Inject(ITrackingGateway)
    private readonly trackingGateway: ITrackingGateway
  ) {}

  async execute(dto: LocationUpdateDto): Promise<void> {
    const locationResult = Location.create({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    if (locationResult.isErr()) {
      throw new BadRequestException(locationResult.error.message);
    }

    const driverLocation = DriverLocation.create({
      driverId: dto.driverId,
      location: locationResult.value,
    });

    const saveResult = await this.trackingRepository.save(driverLocation);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    const broadcastResult = await this.trackingGateway.broadcastLocationUpdate(
      driverLocation
    );
    if (broadcastResult.isErr()) {
      throw new InternalServerErrorException(broadcastResult.error.message);
    }
  }
}
