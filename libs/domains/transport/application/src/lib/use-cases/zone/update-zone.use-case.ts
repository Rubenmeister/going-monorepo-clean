import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IZoneRepository,
  Zone,
  ZoneKind,
  PolygonRing,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface UpdateZoneInput {
  id: UUID;
  changes: Partial<{
    name: string;
    kind: ZoneKind;
    polygon: PolygonRing;
    surchargePct?: number;
    notes?: string;
    active: boolean;
  }>;
}

@Injectable()
export class UpdateZoneUseCase {
  constructor(
    @Inject(IZoneRepository)
    private readonly zoneRepo: IZoneRepository,
  ) {}

  async execute(input: UpdateZoneInput): Promise<Zone> {
    const findResult = await this.zoneRepo.findById(input.id);
    if (findResult.isErr()) {
      throw new InternalServerErrorException(findResult.error.message);
    }
    const current = findResult.value;
    if (!current) throw new NotFoundException(`Zone ${input.id} not found`);

    const updateResult = current.update(input.changes);
    if (updateResult.isErr()) {
      throw new BadRequestException(updateResult.error.message);
    }
    const updated = updateResult.value;

    const saveResult = await this.zoneRepo.update(updated);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return updated;
  }
}
