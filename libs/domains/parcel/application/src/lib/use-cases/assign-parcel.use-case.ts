import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * AssignParcelUseCase — un conductor acepta una solicitud de envío.
 *
 * Semántica "first-accept-wins":
 *   - Si el parcel ya tiene driverId asignado, devolvemos 409 Conflict
 *     (otro conductor lo aceptó antes).
 *   - El estado pasa de 'pending' a 'pickup_assigned'.
 *
 * Este use-case es invocado desde POST /parcels/:id/accept por un conductor
 * autenticado. El conductor real viene del JWT (driverId), no del body.
 */
@Injectable()
export class AssignParcelUseCase {
  private readonly logger = new Logger(AssignParcelUseCase.name);

  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(parcelId: UUID, driverId: UUID): Promise<{
    id: string;
    driverId: string;
    status: string;
    trackingCode: string;
  }> {
    const findResult = await this.parcelRepo.findById(parcelId);

    if (findResult.isErr()) {
      this.logger.error(
        `Error buscando parcel ${parcelId}: ${findResult.error.message}`,
      );
      throw new InternalServerErrorException(findResult.error.message);
    }

    const parcel = findResult.value;
    if (!parcel) {
      throw new NotFoundException('Envío no encontrado');
    }

    // Idempotencia: si ya está asignado a este conductor, retornar OK.
    if (parcel.driverId === driverId) {
      return {
        id: parcel.id,
        driverId,
        status: parcel.status,
        trackingCode: parcel.trackingCode,
      };
    }

    // Conflict: ya fue tomado por otro conductor.
    if (parcel.driverId && parcel.driverId !== driverId) {
      throw new ConflictException('Este envío ya fue aceptado por otro conductor');
    }

    // Intentar transición de estado pending → pickup_assigned.
    const assignResult = parcel.assignDriver(driverId);
    if (assignResult.isErr()) {
      // Ej: estado ya no es 'pending' (cancelado, en tránsito, etc.)
      throw new ConflictException(assignResult.error.message);
    }

    const updateResult = await this.parcelRepo.update(parcel);
    if (updateResult.isErr()) {
      this.logger.error(
        `Error actualizando parcel ${parcelId}: ${updateResult.error.message}`,
      );
      throw new InternalServerErrorException(updateResult.error.message);
    }

    this.logger.log(
      `Parcel ${parcelId} asignado a driver ${driverId} (trackingCode=${parcel.trackingCode})`,
    );

    return {
      id: parcel.id,
      driverId,
      status: parcel.status,
      trackingCode: parcel.trackingCode,
    };
  }
}
