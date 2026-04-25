import { Inject, Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
  IZoneRepository,
  Zone,
  ZoneKind,
  PolygonRing,
} from '@going-monorepo-clean/domains-transport-core';

export interface CreateZoneInput {
  name: string;
  kind: ZoneKind;
  polygon: PolygonRing;
  surchargePct?: number;
  notes?: string;
}

@Injectable()
export class CreateZoneUseCase {
  constructor(
    @Inject(IZoneRepository)
    private readonly zoneRepo: IZoneRepository,
  ) {}

  async execute(input: CreateZoneInput): Promise<Zone> {
    const zoneResult = Zone.create(input);
    if (zoneResult.isErr()) {
      throw new BadRequestException(zoneResult.error.message);
    }
    const zone = zoneResult.value;

    const saveResult = await this.zoneRepo.save(zone);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return zone;
  }
}
