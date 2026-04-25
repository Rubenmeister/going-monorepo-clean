import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IDriverBaseRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class DeleteDriverBaseUseCase {
  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
  ) {}

  async execute(
    id: UUID,
    opts: { hard?: boolean; asDriverId?: UUID } = {},
  ): Promise<{ id: string; deleted: boolean }> {
    const found = await this.baseRepo.findById(id);
    if (found.isErr()) throw new InternalServerErrorException(found.error.message);
    const base = found.value;
    if (!base) throw new NotFoundException(`DriverBase ${id} not found`);

    if (opts.asDriverId && base.driverId !== opts.asDriverId) {
      throw new ForbiddenException('Cannot delete another driver base');
    }

    if (opts.hard) {
      const del = await this.baseRepo.delete(id);
      if (del.isErr()) throw new InternalServerErrorException(del.error.message);
      return { id, deleted: true };
    }

    const deactivated = base.deactivate();
    const upd = await this.baseRepo.update(deactivated);
    if (upd.isErr()) throw new InternalServerErrorException(upd.error.message);
    return { id, deleted: false };
  }
}
