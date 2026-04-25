import {
  Inject,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IZoneRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * DeleteZone — hard delete opcional; por default hace soft-delete
 * (marca `active: false`). Usar hard=true sólo desde admin avanzado.
 */
@Injectable()
export class DeleteZoneUseCase {
  constructor(
    @Inject(IZoneRepository)
    private readonly zoneRepo: IZoneRepository,
  ) {}

  async execute(id: UUID, opts: { hard?: boolean } = {}): Promise<{ id: string; deleted: boolean }> {
    const findResult = await this.zoneRepo.findById(id);
    if (findResult.isErr()) {
      throw new InternalServerErrorException(findResult.error.message);
    }
    const zone = findResult.value;
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);

    if (opts.hard) {
      const del = await this.zoneRepo.delete(id);
      if (del.isErr()) throw new InternalServerErrorException(del.error.message);
      return { id, deleted: true };
    }

    // Soft-delete
    const soft = zone.deactivate();
    const upd = await this.zoneRepo.update(soft);
    if (upd.isErr()) throw new InternalServerErrorException(upd.error.message);
    return { id, deleted: false };
  }
}
