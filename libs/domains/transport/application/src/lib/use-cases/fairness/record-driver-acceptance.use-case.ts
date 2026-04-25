import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  IFairnessCounterRepository,
  defaultPeriodKey,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface RecordAcceptanceInput {
  driverId: UUID;
  baseId?: UUID;
  /** Override del periodo. Default: día calendario Ecuador. */
  periodKey?: string;
}

/**
 * RecordDriverAcceptance — incrementa el contador del driver cuando
 * acepta un viaje/envío. Se llama desde AcceptTrip / AcceptParcel.
 *
 * Es fire-and-forget: si Redis falla, sólo se loguea — la aceptación
 * NO debe revertirse por un counter caído.
 */
@Injectable()
export class RecordDriverAcceptanceUseCase {
  private readonly logger = new Logger(RecordDriverAcceptanceUseCase.name);

  constructor(
    @Inject(IFairnessCounterRepository)
    private readonly counter: IFairnessCounterRepository,
  ) {}

  async execute(input: RecordAcceptanceInput): Promise<void> {
    const result = await this.counter.increment({
      driverId: input.driverId,
      baseId: input.baseId,
      periodKey: input.periodKey ?? defaultPeriodKey(),
    });

    if (result.isErr()) {
      this.logger.warn(
        `Failed to record fairness for driver ${input.driverId}: ${result.error.message}`,
      );
      return;
    }
    this.logger.debug(
      `Driver ${input.driverId} acceptance count: ${result.value} (period ${input.periodKey ?? defaultPeriodKey()})`,
    );
  }
}
