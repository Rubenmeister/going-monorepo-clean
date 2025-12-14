import {
  DriverLocation,
  IDriverLocationRepository,
  IDriverLocationGateway,
} from '@going-monorepo-clean/domains-tracking-core';
import { Result, ok, err } from 'neverthrow';

export interface UpdateDriverLocationCommand {
  driverId: string;
  latitude: number;
  longitude: number;
}

export class UpdateDriverLocationUseCase {
  constructor(
    private readonly locationRepo: IDriverLocationRepository,
    private readonly locationGateway: IDriverLocationGateway,
  ) {}

  async execute(command: UpdateDriverLocationCommand): Promise<Result<void, Error>> {
    const locationOrError = DriverLocation.create({
      driverId: command.driverId,
      latitude: command.latitude,
      longitude: command.longitude,
    });

    if (locationOrError.isErr()) {
      return err(locationOrError.error);
    }

    const location = locationOrError.value;

    // 1. Guardar la ubicación en la base de datos (Redis/DB)
    const saveResult = await this.locationRepo.save(location);
    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    // 2. Emitir la ubicación a los clientes suscritos (Gateway)
    const broadcastResult = await this.locationGateway.broadcastLocation(location);
    if (broadcastResult.isErr()) {
      // Loggear error pero no fallar el caso de uso si solo es broadcast?
      // O devolver error? Devolveremos error por ahora.
      return err(broadcastResult.error);
    }

    return ok(undefined);
  }
}
