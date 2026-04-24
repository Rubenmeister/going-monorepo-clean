import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * CancelParcelUseCase — cancelar un envío.
 *
 * Invocado en dos caminos:
 *   1. Usuario cancela manualmente (reason='user_cancel') desde la app.
 *   2. Orchestrator cancela automáticamente (reason='no_driver_found')
 *      después de agotar reintentos sin conductor que acepte.
 *
 * Sólo válido en estados 'pending' y 'pickup_assigned'. Si ya está
 * 'in_transit' o 'delivered', rechazamos.
 */
@Injectable()
export class CancelParcelUseCase {
  private readonly logger = new Logger(CancelParcelUseCase.name);

  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(
    parcelId: UUID,
    reason: 'user_cancel' | 'no_driver_found' | 'admin' = 'user_cancel',
  ): Promise<{ id: string; status: string; reason: string }> {
    const findResult = await this.parcelRepo.findById(parcelId);
    if (findResult.isErr()) {
      throw new InternalServerErrorException(findResult.error.message);
    }

    const parcel = findResult.value;
    if (!parcel) throw new NotFoundException('Envío no encontrado');

    const cancelResult = parcel.cancel(reason);
    if (cancelResult.isErr()) {
      throw new ConflictException(cancelResult.error.message);
    }

    const updateResult = await this.parcelRepo.update(parcel);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }

    this.logger.log(
      `Parcel ${parcelId} cancelado (reason=${reason}, trackingCode=${parcel.trackingCode})`,
    );

    return { id: parcel.id, status: parcel.status, reason };
  }
}
