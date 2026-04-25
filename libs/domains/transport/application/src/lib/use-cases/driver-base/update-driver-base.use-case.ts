import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IDriverBaseRepository,
  DriverBase,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface UpdateDriverBaseInput {
  id: UUID;
  /** Si caller no es admin, debe match con base.driverId. */
  asDriverId?: UUID;
  changes: Partial<{
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    shiftStart?: string;
    shiftEnd?: string;
    isPrimary: boolean;
    active: boolean;
    notes?: string;
  }>;
}

@Injectable()
export class UpdateDriverBaseUseCase {
  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
  ) {}

  async execute(input: UpdateDriverBaseInput): Promise<DriverBase> {
    const findResult = await this.baseRepo.findById(input.id);
    if (findResult.isErr()) {
      throw new InternalServerErrorException(findResult.error.message);
    }
    const current = findResult.value;
    if (!current) throw new NotFoundException(`DriverBase ${input.id} not found`);

    if (input.asDriverId && current.driverId !== input.asDriverId) {
      throw new BadRequestException(
        'Cannot modify another driver base — admin role required',
      );
    }

    // Si se está marcando como primary, demarcar otras del mismo driver.
    if (input.changes.isPrimary === true && !current.isPrimary) {
      const all = await this.baseRepo.findByDriverId(current.driverId);
      if (all.isOk()) {
        for (const other of all.value) {
          if (other.id !== current.id && other.isPrimary) {
            const demoted = other.update({ isPrimary: false });
            if (demoted.isOk()) await this.baseRepo.update(demoted.value);
          }
        }
      }
    }

    const updateResult = current.update(input.changes);
    if (updateResult.isErr()) {
      throw new BadRequestException(updateResult.error.message);
    }
    const updated = updateResult.value;

    const save = await this.baseRepo.update(updated);
    if (save.isErr()) {
      throw new InternalServerErrorException(save.error.message);
    }
    return updated;
  }
}
