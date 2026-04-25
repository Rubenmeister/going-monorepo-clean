import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IFairnessCounterRepository,
  DriverFairnessSnapshot,
  defaultPeriodKey,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface GetDriverFairnessInput {
  driverIds: UUID[];
  baseId?: UUID;
  periodKey?: string;
}

/**
 * GetDriverFairness — consulta los counters de varios drivers en
 * un solo round-trip a Redis (mget).
 *
 * Usado por:
 *   - MatchAvailableDrivers para tie-break: a igualdad de rating+base,
 *     el driver con MENOR count gana.
 *   - Admin dashboard para ver distribución de carga por base.
 */
@Injectable()
export class GetDriverFairnessUseCase {
  constructor(
    @Inject(IFairnessCounterRepository)
    private readonly counter: IFairnessCounterRepository,
  ) {}

  async execute(input: GetDriverFairnessInput): Promise<DriverFairnessSnapshot[]> {
    if (input.driverIds.length === 0) return [];

    const period = input.periodKey ?? defaultPeriodKey();
    const keys = input.driverIds.map((driverId) => ({
      driverId,
      baseId: input.baseId,
      periodKey: period,
    }));

    const result = await this.counter.getMany(keys);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }
}
