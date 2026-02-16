import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Vehicle,
  IVehicleRepository,
  VehicleType,
} from '@going-monorepo-clean/domains-transport-core';
import { RegisterVehicleDto } from '../dto/register-vehicle.dto';

@Injectable()
export class RegisterVehicleUseCase {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepo: IVehicleRepository,
  ) {}

  async execute(dto: RegisterVehicleDto): Promise<{ id: string }> {
    // Verificar placa duplicada
    const existingResult = await this.vehicleRepo.findByPlate(dto.plate.toUpperCase());
    if (existingResult.isOk() && existingResult.value) {
      throw new InternalServerErrorException('Vehicle with this plate already exists');
    }

    const vehicleTypeResult = VehicleType.create(dto.vehicleType);
    if (vehicleTypeResult.isErr()) {
      throw new InternalServerErrorException(vehicleTypeResult.error.message);
    }

    const vehicleResult = Vehicle.create({
      driverId: dto.driverId,
      type: vehicleTypeResult.value,
      plate: dto.plate,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      color: dto.color,
      seatCount: dto.seatCount,
      frontSeatCount: dto.frontSeatCount,
      hasDashcam: dto.hasDashcam,
    });

    if (vehicleResult.isErr()) {
      throw new InternalServerErrorException(vehicleResult.error.message);
    }

    const vehicle = vehicleResult.value;
    const saveResult = await this.vehicleRepo.save(vehicle);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    return { id: vehicle.id };
  }
}
