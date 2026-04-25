import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IZoneRepository,
  Zone,
  ZoneKind,
} from '@going-monorepo-clean/domains-transport-core';

@Injectable()
export class ListZonesUseCase {
  constructor(
    @Inject(IZoneRepository)
    private readonly zoneRepo: IZoneRepository,
  ) {}

  async execute(filter?: {
    kind?: ZoneKind;
    active?: boolean;
  }): Promise<Zone[]> {
    const result = await this.zoneRepo.findAll(filter);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }
}
