import { Result, ok, err } from 'neverthrow';

export enum VehicleTypeEnum {
  SUV = 'SUV',
  VAN = 'VAN',
  BUS = 'BUS',
  SEDAN = 'SEDAN',
  PICKUP = 'PICKUP',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER',
}

export interface VehicleCapacity {
  maxPassengers: number;
  maxCargoKg: number;
  hasFrontSeat: boolean;
}

const CAPACITY_MAP: Record<VehicleTypeEnum, VehicleCapacity> = {
  [VehicleTypeEnum.SUV]: { maxPassengers: 6, maxCargoKg: 200, hasFrontSeat: true },
  [VehicleTypeEnum.VAN]: { maxPassengers: 12, maxCargoKg: 500, hasFrontSeat: true },
  [VehicleTypeEnum.BUS]: { maxPassengers: 40, maxCargoKg: 1000, hasFrontSeat: false },
  [VehicleTypeEnum.SEDAN]: { maxPassengers: 4, maxCargoKg: 100, hasFrontSeat: true },
  [VehicleTypeEnum.PICKUP]: { maxPassengers: 3, maxCargoKg: 800, hasFrontSeat: true },
  [VehicleTypeEnum.MOTORCYCLE]: { maxPassengers: 1, maxCargoKg: 20, hasFrontSeat: false },
  [VehicleTypeEnum.OTHER]: { maxPassengers: 4, maxCargoKg: 100, hasFrontSeat: true },
};

export class VehicleType {
  readonly value: VehicleTypeEnum;
  readonly capacity: VehicleCapacity;

  private constructor(value: VehicleTypeEnum) {
    this.value = value;
    this.capacity = CAPACITY_MAP[value];
  }

  public static create(value: string): Result<VehicleType, Error> {
    const upper = value.toUpperCase() as VehicleTypeEnum;
    if (!Object.values(VehicleTypeEnum).includes(upper)) {
      return err(new Error(`Invalid vehicle type: ${value}. Valid: ${Object.values(VehicleTypeEnum).join(', ')}`));
    }
    return ok(new VehicleType(upper));
  }

  public toPrimitives(): string {
    return this.value;
  }

  public static fromPrimitives(value: string): VehicleType {
    return new VehicleType(value as VehicleTypeEnum);
  }
}
