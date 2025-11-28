import { DriverLocation } from '../entities/driver-location.entity';
import { IDriverLocationRepository } from '../ports/idriver-location.repository';
import { IDriverLocationGateway } from '../ports/idriver-location.gateway';
import { LocationVO } from '@myorg/shared/domain/location.vo';
import { DriverId } from '../entities/driver.entity';

interface UpdateDriverLocationCommand {
  driverId: DriverId;
  lat: number;
  lng: number;
  tripId?: string;
  speed?: number;
  heading?: number;
}

export class UpdateDriverLocationUseCase {
  constructor(
    private locationRepo: IDriverLocationRepository,
    private locationGateway: IDriverLocationGateway,
  ) {}

  async execute(command: UpdateDriverLocationCommand): Promise<void> {
    const { driverId, lat, lng, tripId, speed, heading } = command;

    const location = new DriverLocation({
      driverId,
      location: new LocationVO(lat, lng),
      tripId,
      speed,
      heading,
    });

    // 1. Guardar la ubicación en la base de datos
    await this.locationRepo.save(location);

    // 2. Emitir la ubicación a los clientes suscritos (por WebSocket o SSE)
    await this.locationGateway.broadcastLocation(location);
  }
}