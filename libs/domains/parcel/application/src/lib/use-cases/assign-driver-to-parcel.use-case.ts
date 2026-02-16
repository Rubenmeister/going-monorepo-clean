import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class AssignDriverToParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(parcelId: UUID, driverId: UUID): Promise<void> {
    const result = await this.parcelRepo.findById(parcelId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Parcel with id ${parcelId} not found`);
    }

    const parcel = result.value;
    const assignResult = parcel.assignDriver(driverId);

    if (assignResult.isErr()) {
      throw new PreconditionFailedException(assignResult.error.message);
    }

    const updateResult = await this.parcelRepo.update(parcel);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
