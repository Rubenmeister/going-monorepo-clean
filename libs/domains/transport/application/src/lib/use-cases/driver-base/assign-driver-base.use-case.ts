import {
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IDriverBaseRepository,
  DriverBase,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface AssignDriverBaseInput {
  driverId: UUID;
  name: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  shiftStart?: string;
  shiftEnd?: string;
  isPrimary?: boolean;
  notes?: string;
}

/**
 * AssignDriverBase — crea una nueva base para un conductor.
 *
 * Si `isPrimary=true` y el driver ya tiene una primary base, la
 * marca como no-primary primero (sólo una base primaria por driver).
 */
@Injectable()
export class AssignDriverBaseUseCase {
  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
  ) {}

  async execute(input: AssignDriverBaseInput): Promise<DriverBase> {
    const created = DriverBase.create(input);
    if (created.isErr()) {
      throw new BadRequestException(created.error.message);
    }
    let base = created.value;

    // Si esta nueva base es primary, demarcar otras del mismo driver.
    if (base.isPrimary) {
      const existing = await this.baseRepo.findByDriverId(input.driverId);
      if (existing.isOk()) {
        for (const other of existing.value) {
          if (other.isPrimary) {
            const demoted = other.update({ isPrimary: false });
            if (demoted.isOk()) {
              await this.baseRepo.update(demoted.value);
            }
          }
        }
      }
    } else {
      // Si no especifica primary y no tiene ninguna, hacer ésta primary
      // automáticamente.
      const primary = await this.baseRepo.findPrimaryByDriverId(input.driverId);
      if (primary.isOk() && !primary.value) {
        const promoted = base.update({ isPrimary: true });
        if (promoted.isOk()) base = promoted.value;
      }
    }

    const saveResult = await this.baseRepo.save(base);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return base;
  }
}
